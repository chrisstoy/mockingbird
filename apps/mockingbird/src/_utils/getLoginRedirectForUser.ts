'use server';
import { DocumentId } from '@/_types';
import { requireAcceptToS } from './requireAcceptToS';

type LoginRedirectParams = {
  acceptedToS?: DocumentId;
};

export async function getLoginRedirectUrlForUser(
  { acceptedToS }: LoginRedirectParams,
  defaultRedirect = '/'
) {
  try {
    if (!acceptedToS) {
      return '/auth/tos?requireAcceptance=true&newTOS=false';
    }

    const { requireAcceptance, newTOS } = await requireAcceptToS(acceptedToS);
    if (requireAcceptance) {
      return `/auth/tos?requireAcceptance=true&newTOS=${
        newTOS ? 'true' : 'false'
      }`;
    }

    // no specific redirect, so return the default home page
    return defaultRedirect;
  } catch (error) {
    // Return a fallback route instead of throwing
    return defaultRedirect;
  }
}
