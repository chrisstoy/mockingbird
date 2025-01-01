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
    return createErrorResponse(500, `Invalid data: ` + JSON.stringify(error));
  }

  if (error instanceof ResponseError) {
    return createErrorResponse(error.status, error.message);
  }

  if (error instanceof Error) {
    return createErrorResponse(500, `${error.name}: ${error.message}`);
  }

  return createErrorResponse(500, `${error}`);
}
