import { APActivity } from 'activitypub-types';
import { z } from 'zod';
import baseLogger from '../logger';
import { queueForFederation } from './federationService';

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

export async function processActivity(activity: APActivity) {
  if (!validateActivity(activity)) {
    throw new Error('Invalid activity');
  }

  // Process based on activity type
  switch (activity.type) {
    // case 'Create':
    //   await handleCreate(activity);
    //   break;
    // case 'Follow':
    //   await handleFollow(activity);
    //   break;
    // case 'Like':
    //   await handleLike(activity);
    //   break;
    // case 'Announce':
    //   await handleAnnounce(activity);
    //   break;
    // case 'Delete':
    //   await handleDelete(activity);
    //   break;
    // case 'Undo':
    //   await handleUndo(activity);
    //   break;
    default:
      console.log(`Unhandled activity type: ${activity.type}`);
  }

  // Queue for federation if needed
  await queueForFederation(activity);
}
