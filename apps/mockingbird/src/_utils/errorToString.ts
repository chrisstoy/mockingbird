import { ZodError } from 'zod';

export function errorToString(error: unknown) {
  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    });
    return messages.join(', ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
