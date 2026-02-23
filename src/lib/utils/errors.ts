export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export function unauthorizedError() {
  return apiError(401, 'Unauthorized');
}

export function notFoundError(resource = 'Resource') {
  return apiError(404, `${resource} not found`);
}

export function validationError(message: string) {
  return apiError(422, message);
}

export function serverError(message = 'Internal server error') {
  return apiError(500, message);
}
