import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import type {
  WireContact,
  WireSafetyAlert,
  WireTrip,
  WireTripWithItinerary,
  WireUser,
} from './mappers';
import type {
  AssistantDetails,
  AssistantPlan,
  AssistantReply,
  AuthSession,
  AnalyticsResponse,
} from '@/types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();

    // A proxy or gateway can return HTML or an empty body, so parsing must not
    // be allowed to mask the actual HTTP status.
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new ApiError('The server returned an unreadable response.', response.status, text);
        }
      }
    }

    if (!response.ok) {
      const message =
        (payload as { message?: string; error?: string } | null)?.message ??
        (payload as { error?: string } | null)?.error ??
        `Request failed (${response.status})`;
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, token?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', token, signal }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE', token }),
};

export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthSession & { user: WireUser }>('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post<AuthSession & { user: WireUser }>('/auth/login', body),
  me: (token: string) => api.get<WireUser>('/auth/me', token),
};

export const tripsApi = {
  list: (token: string, signal?: AbortSignal) => api.get<WireTrip[]>('/trips', token, signal),
  get: (id: string, token: string) => api.get<WireTripWithItinerary>(`/trips/${id}`, token),
  create: (
    body: {
      destination: string;
      startDate: string;
      endDate: string;
      travellers: number;
      budget?: number;
      currency?: string;
    },
    token: string,
  ) => api.post<WireTrip>('/trips', body, token),
  generate: (id: string, token: string) =>
    api.post<{
      trip: WireTripWithItinerary;
      source: 'ai' | 'mock';
      safetyNotes: string[];
    }>(`/trips/${id}/generate`, undefined, token),
  update: (id: string, body: { status?: string; title?: string }, token: string) =>
    api.patch<WireTrip>(`/trips/${id}`, body, token),
  remove: (id: string, token: string) => api.delete<void>(`/trips/${id}`, token),
};

export const assistantApi = {
  send: (
    body: { message: string; details?: AssistantDetails; history?: { message: string }[] },
    token: string,
  ) => api.post<AssistantReply>('/assistant/message', body, token),
  adopt: (
    body: {
      tripId?: string;
      itinerary: AssistantPlan;
      destination: string;
      startDate: string;
      endDate: string;
      travellers: number;
      budget?: number;
      currency?: string;
    },
    token: string,
  ) =>
    api.post<{
      trip: WireTripWithItinerary;
      safetyNotes: string[];
      created: boolean;
    }>('/assistant/adopt', body, token),
};

export const analyticsApi = {
  get: (token: string, signal?: AbortSignal) =>
    api.get<AnalyticsResponse>('/analytics', token, signal),
};

export const safetyApi = {
  contacts: (token: string) => api.get<WireContact[]>('/safety/contacts', token),
  addContact: (
    body: { name: string; phone: string; relation: string; isPrimary?: boolean },
    token: string,
  ) => api.post<WireContact>('/safety/contacts', body, token),
  removeContact: (id: string, token: string) => api.delete<void>(`/safety/contacts/${id}`, token),
  alerts: (token: string) => api.get<WireSafetyAlert[]>('/safety/alerts', token),
  sos: (body: { latitude: number; longitude: number; tripId?: string; message?: string }, token: string) =>
    api.post<{
      alert: WireSafetyAlert;
      notified: {
        delivered: number;
        failed: number;
        simulated: boolean;
        message: string;
        channel: string;
      };
    }>('/safety/sos', body, token),
  checkIn: (
    body: { latitude: number; longitude: number; note?: string; tripId?: string },
    token: string,
  ) => api.post<{ checkIn: { id: string; createdAt: string }; alert: WireSafetyAlert }>(
    '/safety/check-ins',
    body,
    token,
  ),
  acknowledge: (id: string, token: string) =>
    api.patch<WireSafetyAlert>(`/safety/alerts/${id}/acknowledge`, undefined, token),
};
