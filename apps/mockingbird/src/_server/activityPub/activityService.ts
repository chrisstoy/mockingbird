import { APActivity } from 'activitypub-types';
import { z } from 'zod';
import baseLogger from '../logger';
import { queueForFederation } from './federationService';
import { processFollowActivity } from './followerService';
import { isAPFollow } from './types';

const logger = baseLogger.child({
  service: 'activitypub:service:activity',
});

const APActivitySchema = z.object({
  '@context': z.string().or(z.string().array()),
  type: z.string(),
  actor: z.string(),
});

/**
 * Returns true if the passed APActivity is valid, false otherwise
 */
export async function validateActivity(_activity: APActivity) {
  const {
    success,
    data: activity,
    error,
  } = APActivitySchema.safeParse(_activity);
  if (!success) {
    logger.error('Failed to validate activity', error);
    return false;
  }

  // Verify the context includes ActivityStreams
  const context = Array.isArray(activity['@context'])
    ? activity['@context']
    : [activity['@context']];

  return context.includes('https://www.w3.org/ns/activitystreams');
}

/**
 * Process the delivered Activity
 * @param activity
 */
export async function processActivity(activity: APActivity) {
  if (!validateActivity(activity)) {
    throw new Error('Invalid activity');
  }

  if (isAPFollow(activity)) {
    await processFollowActivity(activity);
  }

  if (isAPAccept(activity)) {
  }

  logger.error(`Unhandled activity type: ${activity.type}`);
  throw new Error(`Unhandled activity type: ${activity.type}`);
}

/**
 *
 * @param activity
 */
export async function deliverActivity(activity: APActivity) {
  // TODO - implement this!
}
