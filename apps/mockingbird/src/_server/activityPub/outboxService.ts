import { APActivity, APCreate } from 'activitypub-types';
import { processOutboxFollowActivity } from './followerService';
import { createNoteFrom } from './noteService';
import { isAPCreate, isAPFollow, isAPNote } from './types';

/**
 * Validate the activity and generate IDs for activities
 * and objects.  Then, deliver the activity to the actor's
 * inbox.
 */
export async function processOutboxActivity(activity: APActivity) {
  if (isAPFollow(activity)) {
    return processOutboxFollowActivity(activity);
  }

  if (isAPCreate(activity)) {
    return processCreateActivity(activity);
  }

  throw new Error(`Unsupported Activity type: ${activity.type}`);
}

/**
 * Create the object in the activity
 *
 * The job of the Outbox is to create and store the Objects
 * reprenenting the activity in the local database. This will create
 * the required UIDs for the Activity and the Objects associated with the
 * activity. Once we have that, we can deliver the activity to the inbox
 * which will handle the rest of the processing as if the Activity
 * came from an external federated source.
 */
export async function processCreateActivity(activity: APCreate) {
  const rawObject = Array.isArray(activity.object)
    ? activity.object[0] // Only support a single object
    : activity.object;

  if (!rawObject || typeof rawObject === 'string') {
    throw new Error('No valid Object in activity');
  }

  if (isAPNote(rawObject)) {
    const newNote = await createNoteFrom(rawObject);

    // save the activity

    return newNote;
  }

  throw new Error(`Object type nosupported: ${rawObject.type}`);
}

export async function getOutboxCollectionFor() {
  
}
