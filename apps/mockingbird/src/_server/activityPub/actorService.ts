import { baseUrlForApi } from '@/_apiServices/apiUrlFor';
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserId, UserIdSchema } from '@/_types/users';
import { APActor, APCollection } from 'activitypub-types';
import { z } from 'zod';
import { APActorSchema, APUIDSchema } from './schemas';
import { ActorIdSchema } from './types';
import { Actor } from '@prisma/client';

const logger = baseLogger.child({
  service: 'activitypub:service:actor',
});

export const ActorSchema = z.object({
  id: ActorIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  userId: UserIdSchema.nullable(),

  actorId: APUIDSchema,
  preferredUsername: z.string(),
  name: z.string(),
  summary: z.string(),
  icon: z.string().nullable(),
});

export async function actorIdForName(name: string) {
  const baseUrl = await baseUrlForApi();
  return `${baseUrl}/actors/${name}`;
}

/**
 * Return a collection of all Actors that have a Local account
 */
export async function getLocalActors() {
  try {
    const rawActors = await prisma.actor.findMany({
      where: {
        userId: {
          not: null,
        },
      },
    });

    const actors = z.array(ActorSchema).parse(rawActors);

    const actorUIDs = actors.map(({ actorId }) => actorId);

    const actorCollection: APCollection = {
      type: 'Collection',
      totalItems: actorUIDs.length,
      items: actorUIDs,
    };
    return actorCollection;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}

export async function getActorByUserId(userId: UserId) {
  logger.info(`Search for Actor with userId: ${userId}`);

  const rawActor = await prisma.actor.findFirst({
    where: {
      id: userId,
    },
  });

  if (!rawActor) {
    logger.warn(`Actor with userId: ${userId} not found`);
    return undefined;
  }

  const actor = ActorSchema.parse(rawActor);

  const apActor = createAPActorFrom(actor);
  return apActor;
}

export async function doesActorExist(name: string): Promise<boolean> {
  const rawData = await prisma.user.findFirst({
    where: {
      name: {
        contains: name,
        // mode: 'insensitive', // not supporte din sqlite
      },
    },
  });

  return !!rawData;
}

export async function getActorByName(name: string) {
  logger.info(`Search for Actor with username: ${name}`);

  const rawActor = await prisma.actor.findFirst({
    where: {
      name: {
        contains: name,
        // mode: 'insensitive', // not supporte din sqlite
      },
    },
  });

  if (!rawActor) {
    logger.error(`Actor with username: ${name} not found`);
    return undefined;
  }

  const actor = ActorSchema.parse(rawActor);

  const apActor = createAPActorFrom(actor);
  return apActor;
}

function createAPActorFrom(dbActor: Actor) {
  const apActor = APActorSchema.parse({
    type: 'Person',
    id: dbActor.actorId,
    name: dbActor.name,
    preferredUsername: dbActor.preferredUsername,
    summary: dbActor.summary,
    icon: dbActor.icon ?? undefined,
    inbox: `${dbActor.actorId}/inbox`,
    outbox: `${dbActor.actorId}/outbox`,
    followers: `${dbActor.actorId}/followers`,
    following: `${dbActor.actorId}/following`,
    liked: `${dbActor.actorId}/liked`,
  });
  return apActor as unknown as APActor;
}
