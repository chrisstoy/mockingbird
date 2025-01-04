import { auth } from '@/app/auth';
import { ResponseError } from './errors';

/**
 * Validates that there is an active Session.  If not, throws an error
 *
 * @returns the active Session
 * @throws {ResponseError}
 */
export async function validateAuthentication() {
  const authSession = await auth();
  if (!authSession?.user) {
    throw new ResponseError(401, 'User not logged in');
  }
  return authSession;
}
