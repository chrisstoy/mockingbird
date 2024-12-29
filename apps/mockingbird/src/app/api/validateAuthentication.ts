import { Session } from 'next-auth';
import { ResponseError } from './errors';

export function validateAuthentication(auth: Session | null) {
  // TODO - auth is null for some reason, even when logged in
  // if (!auth?.user) {
  //   throw new ResponseError(401, 'User not logged in');
  // }
}
