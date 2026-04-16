import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { PostReactionSummary, PostId, ReactionType, UserId } from '@/_types';
import { errorToString } from '@/_utils/errorToString';

const logger = baseLogger.child({ service: 'reactions:service' });

type RawReactionRow = {
  userId: string;
  reaction: string;
  user: { id: string; name: string; image: string | null };
};

export function groupPostReactions(
  raw: RawReactionRow[]
): PostReactionSummary[] {
  const map = new Map<string, PostReactionSummary>();

  for (const row of raw) {
    const existing = map.get(row.reaction);
    const user = { id: row.userId as UserId, name: row.user.name, image: row.user.image };

    if (existing) {
      existing.count += 1;
      existing.users.push(user);
    } else {
      map.set(row.reaction, {
        type: row.reaction as ReactionType,
        count: 1,
        users: [user],
      });
    }
  }

  return Array.from(map.values());
}

export async function setReaction(
  postId: PostId,
  userId: UserId,
  reaction: ReactionType
): Promise<void> {
  try {
    await prisma.postReaction.upsert({
      where: { postId_userId: { postId, userId } },
      update: { reaction },
      create: { postId, userId, reaction },
    });
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`setReaction: ${errorToString(error)}`);
  }
}

export async function removeReaction(
  postId: PostId,
  userId: UserId
): Promise<void> {
  try {
    await prisma.postReaction.delete({
      where: { postId_userId: { postId, userId } },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error; // Let PrismaClientKnownRequestError (e.g. P2025) propagate to the caller
    }
    logger.error(errorToString(error));
    throw new Error(`removeReaction: ${errorToString(error)}`);
  }
}

export async function getReactionsForPost(
  postId: PostId
): Promise<PostReactionSummary[]> {
  try {
    const rows = await prisma.postReaction.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
    return groupPostReactions(rows);
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getReactionsForPost: ${errorToString(error)}`);
  }
}
