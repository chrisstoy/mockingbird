import { APAccept, APCollection, APFollow } from 'activitypub-types';
import { APUID } from './schemas';

/**
 * Create a new Follow activity and send it along
 *
 * The actor wishes to follow the object
 */
export async function processOutboxFollowActivity(activity: APFollow) {
  // register
  throw new Error('Follow Not implemented');
}

export async function processUnfollowActivity(activity: APFollow) {
  throw new Error('Unfollow Not implemented');
}

export async function processAcceptActivity(activity: APAccept) {
  throw new Error('Accept Not implemented');
}

/**
 * Returns the collection of Actors that are following the requested Actor
 */
export function getFollowersFor(actor: APUID): APCollection {
  throw new Error('Not implemented');
}

/**
 * Returns the collection of Actors that the requested Actor is following
 */
export function getFollowingFor(actor: APUID): APCollection {
  throw new Error('Not implemented');
}
