'use server';
import { prisma } from '@/_server/db';
import { DocumentSchema, UserId, UserInfoSchema } from '@/_types';

/**
 * Checks if a user needs to accept the latest Terms of Service (ToS).
 *
 * @param userId - The unique identifier of the user to check.
 * @returns Promise that resolves to an object containing:
 *   - `requireAcceptance`: Whether the user needs to accept the ToS.
 *   - `newTOS`: Whether there is a new ToS that the user has not accepted.
 *   - `userId`: The ID of the user.
 * Rejects with an error if the user cannot be found or if validation fails.
 */
export async function requireAcceptToS(userId: UserId) {
  const rawUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  const { data: user, error: userError } = UserInfoSchema.safeParse(rawUser);
  if (userError) {
    throw new Error(
      `Error finding or parsing User with id ${userId}: ${userError}`
    );
  }

  const rawToS = await prisma.document.findFirst({
    where: {
      type: 'TOC',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  const { data: latestTos, error: tosError } = DocumentSchema.safeParse(rawToS);

  if (tosError) {
    throw new Error(
      `Error finding or parsing latest ToS Document: ${userError}`
    );
  }

  const requireAcceptance = !user.acceptedToS;
  const newTOS = latestTos?.id !== user.acceptedToS && !!user.acceptedToS;

  return {
    requireAcceptance,
    newTOS,
    userId,
  };
}
