import { APNote } from 'activitypub-types';
import { APUID, APUIDSchema } from './schemas';
import { prisma } from '../db';
import { z } from 'zod';
import { BaseDBSchema } from '@/_types/type-utilities';
import { Actor, Note } from '@prisma/client';
import { NoteIdSchema } from './types';

const NoteSchema = BaseDBSchema.extend({
  id: NoteIdSchema,

  attributedTo: APUIDSchema,
  content: z.string(),
  attachments: z.string(),
  tags: z.string(),
});

/**
 * Return an APNote for the specified Note record
 * @param noteId
 */
export async function getNote(noteId: string): Promise<APNote> {
  throw new Error('Not implemented');
}

/**
 * Return ordered list of Notes for the specified Actor
 * @param actorUID
 */
export async function getNotesForActor(actorUID: APUID): Promise<APNote[]> {
  const rawData = await prisma.note.findMany({
    where: {
      attributedTo: actorUID,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const notes = z.array(NoteSchema).parse(rawData);

  const apNotes = notes.map((note) => {
    return {
      type: 'Note',
      id: note.id,
      attributedTo: note.attributedToId,
      content: note.content,
      attachment: note.attachments, // TODO - Attachments are Images or other Objects
      tag: note.tags, // TODO - hash tags
    } as APNote;
  });

  return apNotes;
}

export async function saveNote(source: APNote): Promise<Note> {
  const note = await prisma.note.create({
    data: {
      activityId: 'https://example.org/users/alice/notes/123456',
      actorId: 'https://example.org/users/alice',
      content: 'Beautiful sunset at the beach today!',
      published: new Date(),
      url: 'https://example.org/users/alice/notes/123456',
      isPublic: true,

      // Create audiences (to/cc)
      audiences: {
        createMany: {
          data: [
            {
              audienceType: 'to',
              audienceUri: 'https://www.w3.org/ns/activitystreams#Public',
            },
            {
              audienceType: 'cc',
              audienceUri: 'https://example.org/users/alice/followers',
            },
          ],
        },
      },

      // Create attachment
      attachments: {
        create: {
          type: 'Image',
          mediaType: 'image/jpeg',
          url: 'https://example.org/users/alice/media/sunset_beach.jpg',
          name: 'Sunset at the beach',
          width: 1200,
          height: 800,
        },
      },

      // Create tags with relations
      noteTags: {
        create: [
          {
            href: 'https://example.org/tags/photography',
            tag: {
              connectOrCreate: {
                where: {
                  name_type: { name: 'photography', type: 'Hashtag' },
                },
                create: { name: 'photography', type: 'Hashtag' },
              },
            },
          },
          {
            href: 'https://example.org/tags/nature',
            tag: {
              connectOrCreate: {
                where: { name_type: { name: 'nature', type: 'Hashtag' } },
                create: { name: 'nature', type: 'Hashtag' },
              },
            },
          },
          {
            href: 'https://example.org/tags/sunset',
            tag: {
              connectOrCreate: {
                where: { name_type: { name: 'sunset', type: 'Hashtag' } },
                create: { name: 'sunset', type: 'Hashtag' },
              },
            },
          },
          {
            href: 'https://otherinstance.example/users/bob',
            tag: {
              connectOrCreate: {
                where: { name_type: { name: 'bob', type: 'Mention' } },
                create: { name: 'bob', type: 'Mention' },
              },
            },
          },
        ],
      },
    },
  });

  return note;
}
