import { STATUS_CODES } from 'http';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export class ResponseError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = STATUS_CODES[status] || 'Error';
    this.status = status;
  }
}

export function createErrorResponse(status: number, message: string) {
  const statusText = STATUS_CODES[status] || 'Error';
  return NextResponse.json({ message, status, statusText }, { status });
}

export function respondWithError(error: unknown) {
  if (error instanceof z.ZodError) {
    const messages = error.issues.map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    });
    return createErrorResponse(500, `Invalid data: [${messages.join(', ')}]`);
  }

  if (error instanceof ResponseError) {
    return createErrorResponse(error.status, error.message);
  }

  if (error instanceof Error) {
    return createErrorResponse(500, 'Internal Server Error');
  }

  return createErrorResponse(500, 'Internal Server Error');
}
