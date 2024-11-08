// middleware/errorHandler.ts
import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';

export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ApiException) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
  return;
};