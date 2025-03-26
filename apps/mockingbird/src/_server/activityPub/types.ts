import { createDatabaseIdSchema } from '@/_types/type-utilities';
import {
  APAccept,
  APActivity,
  APActor,
  APArticle,
  APAudio,
  APBlock,
  APCreate,
  APDelete,
  APDislike,
  APDocument,
  APEvent,
  APFlag,
  APFollow,
  APImage,
  APLike,
  APLink,
  APNote,
  APObject,
  APPage,
  APPlace,
  APProfile,
  APRelationship,
  APTombstone,
  APUpdate,
  APVideo,
} from 'activitypub-types';

export type ActorId = string & { brand: 'ActorId' };
export const ActorIdSchema = createDatabaseIdSchema<ActorId>();

export type NoteId = string & { brand: 'NoteId' };
export const NoteIdSchema = createDatabaseIdSchema<NoteId>();

// #region APActivity types
export function isAPCreate(object: APActivity): object is APCreate {
  return object.type === 'Create';
}
export function isAPDelete(object: APActivity): object is APDelete {
  return object.type === 'Delete';
}

export function isAPFollow(object: APActivity): object is APFollow {
  return object.type === 'Follow';
}

export function isAPAccept(object: APActivity): object is APAccept {
  return object.type === 'Accept';
}

export function isAPLike(object: APActivity): object is APLike {
  return object.type === 'Like';
}

export function isAPDislike(object: APActivity): object is APDislike {
  return object.type === 'Dislike';
}

export function isAPUpdate(object: APActivity): object is APUpdate {
  return object.type === 'Update';
}

export function isAPBlock(object: APActivity): object is APBlock {
  return object.type === 'Block';
}

export function isAPFlag(object: APActivity): object is APFlag {
  return object.type === 'Flag';
}

// #endregion

export function isAPLink(object: unknown): object is APLink {
  return (
    typeof object === 'object' &&
    object !== null &&
    'type' in object &&
    object.type === 'Link'
  );
}

// #region APObject types
export function isAPActor(object: APObject): object is APActor {
  return (
    object.type === 'Application' ||
    object.type === 'Group' ||
    object.type === 'Organization' ||
    object.type === 'Person' ||
    object.type === 'Service'
  );
}

export function isAPArticle(object: APObject): object is APArticle {
  return object.type === 'Article';
}

export function isAPAudio(object: APObject): object is APAudio {
  return object.type === 'Audio';
}

export function isAPDocument(object: APObject): object is APDocument {
  return object.type === 'Document';
}

export function isAPEvent(object: APObject): object is APEvent {
  return object.type === 'Event';
}

export function isAPImage(object: APObject): object is APImage {
  return object.type === 'Image';
}
export function isAPNote(object: APObject): object is APNote {
  return object.type === 'Note';
}

export function isAPPage(object: APObject): object is APPage {
  return object.type === 'Page';
}

export function isAPPlace(object: APObject): object is APPlace {
  return object.type === 'Place';
}

export function isAPProfile(object: APObject): object is APProfile {
  return object.type === 'Profile';
}

export function isAPRelationship(object: APObject): object is APRelationship {
  return object.type === 'Relationship';
}

export function isAPTombstone(object: APObject): object is APTombstone {
  return object.type === 'Tombstone';
}

export function isAPVideo(object: APObject): object is APVideo {
  return object.type === 'Video';
}

// #endregion
