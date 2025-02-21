import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { doesActorExist } from '../../../../_server/activityPub/actorService';
import baseLogger from '../../../../_server/logger';
import { WebFingerResponse } from '../../../../_types/webfinger';
import { respondWithError, ResponseError } from './../../../../app/api/errors';

const logger = baseLogger.child({
  service: 'api:webfinger',
});

// https://www.w3.org/TR/activitypub/#webfinger

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    if (!resource) {
      throw new ResponseError(400, 'Resource parameter is required');
    }

    // Parse the resource parameter (expects format: acct:username@domain)
    const match = resource.match(/^acct:([^@]+)@(.+)$/);
    if (!match) {
      throw new ResponseError(400, 'Invalid resource format');
    }

    const [, username, domain] = match;
    const headersList = await headers();
    const host = headersList.get('host') || domain;

    // Verify the domain matches your server
    if (domain !== host && domain !== 'mockingbird.club') {
      throw new ResponseError(404, 'Domain does not match this server');
    }

    // TODO - will need to allow users to create an username,
    // which must be unique on this server.

    // Check if user exists in your system
    // This is where you'd add your user lookup logic
    const userExists = await doesActorExist(username);
    if (!userExists) {
      throw new ResponseError(404, 'User not found');
    }

    const response: WebFingerResponse = {
      subject: `acct:${username}@${domain}`,
      aliases: [], // optional.  should always use to the subject
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `https://${domain}/api/actors/${username}`,
        },
      ],
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/jrd+json',
        'Access-Control-Allow-Origin': '*',
      },
    });

    throw new ResponseError(405, `webfinger not supported`);
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
