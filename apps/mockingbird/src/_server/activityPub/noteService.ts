import { APNote } from 'activitypub-types';

/**
 * Return an APNote for the specified Note record
 * @param noteId
 */
export async function getNote(noteId: string): Promise<APNote> {
  throw new Error('Not implemented');
}

/**
 * create a new Note record from the passed APNote
 * @param note
 */
export async function saveNote(note: APNote): Promise<void> {
  throw new Error('Not implemented');
}

export async function createNoteFrom(data: APNote): Promise<APNote> {
  throw new Error('Not implemented');
}
