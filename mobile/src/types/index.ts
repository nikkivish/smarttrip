export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SafetyLevel = 'safe' | 'caution' | 'risk';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emergencyContacts: EmergencyContact[];
};

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
};

export type TripStatus = 'draft' | 'planning' | 'confirmed' | 'active' | 'completed';

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  status: TripStatus;
  travellers: number;
  budget?: number;
  currency?: string;
  safetyScore?: number;
  safetyLevel?: SafetyLevel;
  summary?: string;
  createdAt: string;
};

export type ItineraryDay = {
  day: number;
  date: string;
  title: string;
  items: ItineraryItem[];
};

export type ItineraryItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  category: 'transport' | 'stay' | 'food' | 'activity' | 'shopping';
  cost?: number;
  safetyLevel?: SafetyLevel;
  /** Human-readable place name from the planner, e.g. "Hauz Khas Village". */
  placeLabel?: string;
  location?: Coordinates & { label?: string };
  imageUrl?: string;
};

export type SafetyAlert = {
  id: string;
  tripId?: string;
  type: 'check_in' | 'sos' | 'area_risk' | 'contact';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  location?: Coordinates;
  createdAt: string;
  acknowledged: boolean;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type AssistantIntent = 'itinerary' | 'advice';

/** `mock` means the server has no provider key and answered from templates. */
export type AssistantSource = 'ai' | 'mock';

export type MissingDetail = 'destination' | 'dates' | 'budget' | 'travellers';

export type AssistantDetails = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  budget?: number;
  travellers?: number;
  interests?: string[];
  pace?: 'relaxed' | 'balanced' | 'packed';
};

export type AssistantPlanItem = {
  time: string;
  title: string;
  description?: string | null;
  category: 'transport' | 'stay' | 'food' | 'activity' | 'shopping';
  cost?: number | null;
  safetyLevel?: 'SAFE' | 'CAUTION' | 'RISK' | null;
  placeLabel?: string | null;
};

export type AssistantPlan = {
  title: string;
  summary: string;
  destination: string;
  safetyScore: number;
  safetyLevel: 'SAFE' | 'CAUTION' | 'RISK';
  safetyNotes: string[];
  days: { day: number; title: string; summary: string; items: AssistantPlanItem[] }[];
};

export type AssistantReply = {
  intent: AssistantIntent;
  reply: string;
  source: AssistantSource;
  missingDetails: MissingDetail[];
  details: AssistantDetails;
  itinerary?: AssistantPlan;
  safetyNotes?: string[];
};

export type AnalyticsInsight = {
  id: string;
  level: 'info' | 'success' | 'warning';
  message: string;
};

export type AnalyticsResponse = {
  meta: {
    scope: 'user' | 'global';
    generatedAt: string;
    currencies: string[];
  };
  kpis: {
    totalUsers: number;
    totalTrips: number;
    itineraryDays: number;
    itineraryItems: number;
    totalAlerts: number;
    averageTripBudget: number;
    averageTripDuration: number;
    averageSafetyScore: number;
    totalTravellers: number;
    totalPlannedCost: number;
    alertAcknowledgementRate: number;
  };
  destinations: {
    destination: string;
    tripCount: number;
    totalBudget: number;
    averageBudget: number | null;
    averageTripDuration: number;
    averageSafetyScore: number | null;
    totalTravellers: number;
  }[];
  costByCategory: {
    category: string;
    itemCount: number;
    totalCost: number;
    costSharePercentage: number;
  }[];
  budgetAnalysis: {
    tripId: string;
    title: string;
    destination: string;
    currency: string;
    budget: number;
    plannedCost: number;
    remainingBudget: number;
    utilizationPercentage: number | null;
    isOverBudget: boolean;
  }[];
  safety: {
    totalAlerts: number;
    sosAlerts: number;
    checkInAlerts: number;
    areaRiskAlerts: number;
    contactAlerts: number;
    infoAlerts: number;
    warningAlerts: number;
    criticalAlerts: number;
    acknowledged: number;
    unacknowledged: number;
    acknowledgementRate: number;
    totalCheckIns: number;
    byType: { type: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
  insights: AnalyticsInsight[];
};
