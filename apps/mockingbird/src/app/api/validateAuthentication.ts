import { ActiveSession, ActiveSessionSchema } from '@/_types';
import { auth } from '@/app/auth';
import { Session } from 'next-auth';
import { ResponseError } from './errors';

/**
 * Validates that there is an active Session.  If not, throws an error
 *
 * @returns the active Session
 * @throws {ResponseError}
 */
export async function validateAuthentication(): Promise<ActiveSession> {
  const authSession: Session | null = await auth();
  if (!authSession?.user) {
    throw new ResponseError(401, 'User not logged in');
  }

  return ActiveSessionSchema.parse(authSession);
}
