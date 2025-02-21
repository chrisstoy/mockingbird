import { baseUrlForApi } from '@/_apiServices/apiUrlFor';
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserInfoSchema } from '@/_types/users';
import { APActivity, APActor } from 'activitypub-types';

const logger = baseLogger.child({
  service: 'activitypub:service:actor',
});

export async function doesActorExist(username: string): Promise<boolean> {
  // TODO - for now, use the email address as the username

  const rawData = await prisma.user.findFirst({
    where: {
      email: {
        contains: `${username}@`,
        mode: 'insensitive',
      },
    },
  });

  return !!rawData;
}

export async function getActorByName(username: string) {
  // TODO - for now, use the email address as the username

  logger.info(`Search for Actor with username: ${username}`);

  const rawData = await prisma.user.findFirst({
    where: {
      email: {
        contains: `${username}@`,
        mode: 'insensitive',
      },
    },
  });

  if (!rawData) {
    return undefined;
  }

  const user = UserInfoSchema.parse(rawData);
  if (!user) {
    return undefined;
  }

  const hostApi = await baseUrlForApi();

  const actor: APActor = {
    id: `acct:${username}@mockingbird.club`,
    name: user.name,
    inbox: `${hostApi}/api/inbox/${username}`,
    outbox: `${hostApi}/api/outbox/${username}`,
  };
  return actor;
}
