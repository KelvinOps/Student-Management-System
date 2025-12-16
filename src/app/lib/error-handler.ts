// src/lib/error-handler.ts

import { Prisma } from '@prisma/client';

// ==================== ERROR CLASSES ====================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: string[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string) {
    super(`${resource} already exists`, 409, 'DUPLICATE');
    this.name = 'DuplicateError';
  }
}

// ==================== ERROR RESPONSE TYPE ====================

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  errors?: string[];
}

// ==================== ERROR HANDLERS ====================

/**
 * Handle Prisma errors and convert to AppError
 */
export function handlePrismaError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.join(', ') || 'field';
        return new DuplicateError(field);

      case 'P2025':
        // Record not found
        return new NotFoundError('Record');

      case 'P2003':
        // Foreign key constraint violation
        return new AppError('Related record not found', 400, 'FOREIGN_KEY_ERROR');

      case 'P2014':
        // Required relation violation
        return new AppError('Invalid relation', 400, 'RELATION_ERROR');

      default:
        return new AppError('Database operation failed', 500, error.code);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided');
  }

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500);
  }

  return new AppError('An unexpected error occurred', 500);
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    ...(error instanceof ValidationError && { errors: error.errors }),
  };
}

/**
 * Safe error logger that doesn't expose sensitive info
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} ${error.name}:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, String(error));
  }
}

/**
 * Async error wrapper for server actions
 * Wraps a function to catch and handle errors automatically
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  context?: string
): (...args: TArgs) => Promise<TReturn | ErrorResponse> {
  return async (...args: TArgs): Promise<TReturn | ErrorResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      const appError = handlePrismaError(error);
      return formatErrorResponse(appError);
    }
  };
}

/**
 * Validate and throw if invalid
 */
export function assertValid(
  condition: boolean,
  message: string,
  errors?: string[]
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, errors);
  }
}

/**
 * Assert resource exists or throw NotFoundError
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string
): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(resourceName);
  }
}

/**
 * Try-catch wrapper that returns result or null
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      logError(error);
    }
    return null;
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logError(error, `Retry attempt ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw handlePrismaError(lastError);
}

/**
 * Check if response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

/**
 * Safe wrapper for server actions with typed return
 */
export async function safeServerAction<T>(
  action: () => Promise<T>
): Promise<{ success: true; data: T } | ErrorResponse> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    logError(error);
    const appError = handlePrismaError(error);
    return formatErrorResponse(appError);
  }
}