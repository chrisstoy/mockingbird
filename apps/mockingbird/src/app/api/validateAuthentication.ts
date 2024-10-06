import { Session } from 'next-auth';
import { ResponseError } from './types';

export function validateAuthentication(auth: Session | null) {
  // if (!auth?.user) {
  //   throw new ResponseError(401, 'User not logged in');
  // }
}
