import { ActiveSession, ActiveSessionSchema, UserId } from '@/_types/users';
import { auth } from '@/app/auth';
import { Session } from 'next-auth';
import { ResponseError } from './errors';
import { getActorByUserId } from '@/_server/activityPub/actorService';
import { APActor } from 'activitypub-types';

type APActorWithUser = APActor & { userId: UserId };

let cachedActor: APActorWithUser | undefined;

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

  const activeSession = ActiveSessionSchema.parse(authSession);
  return activeSession;
}

export async function getAuthenticatedActor(): Promise<APActor | undefined> {
  const session = await validateAuthentication();

  if (!cachedActor || cachedActor.userId !== session.user.id) {
    const actor = await getActorByUserId(session.user.id);
    if (actor) {
      cachedActor = {
        ...actor,
        userId: session.user.id,
      };
    }
    return cachedActor;
  }
}
