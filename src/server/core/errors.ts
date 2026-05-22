export class BadRequestError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
