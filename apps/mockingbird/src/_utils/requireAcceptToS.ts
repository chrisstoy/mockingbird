'use server';
import { prisma } from '@/_server/db';
import { DocumentId, DocumentSchema } from '@/_types';

/**
 * Checks if a user needs to accept the latest Terms of Service (ToS).
 *
 * @param acceptedToS - TID of the currently accepted ToS document by the user.
 * @returns Promise that resolves to an object containing:
 *   - `requireAcceptance`: Whether the user needs to accept the ToS.
 *   - `newTOS`: Whether there is a new ToS that the user has not accepted.
 * Rejects with an error if the ToS document cannot be found
 */
export async function requireAcceptToS(acceptedToS: DocumentId | undefined) {
  if (!acceptedToS) {
    return {
      requireAcceptance: true,
      newTOS: false,
    };
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
      `Error finding or parsing latest ToS Document: ${tosError}`
    );
  }

  // Check if user's accepted ToS matches the latest one
  const requireAcceptance = latestTos?.id !== acceptedToS;
  const newTOS = requireAcceptance && !!acceptedToS;

  return {
    requireAcceptance,
    newTOS,
  };
}
