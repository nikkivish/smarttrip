export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Not authenticated') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Not allowed') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, message);
  }

  static conflict(message: string) {
    return new HttpError(409, message);
  }
}
