import baseLogger from '@/_server/logger';
import { DocumentIdSchema, UserIdSchema } from '@/_types';
import { getLoginRedirectUrlForUser } from '@/_utils/getLoginRedirectForUser';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const logger = baseLogger.child({
  service: 'auth:login-redirect',
});

const LoginRedirectRequestBodySchema = z.object({
  userId: UserIdSchema,
  acceptedToS: DocumentIdSchema.optional(),
  defaultRedirect: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = LoginRedirectRequestBodySchema.parse(await request.json());
    const { acceptedToS, defaultRedirect = '/' } = body;

    const loginRedirect = await getLoginRedirectUrlForUser(
      { acceptedToS },
      defaultRedirect
    );
    return NextResponse.json({ route: loginRedirect });
  } catch (error) {
    logger.error(`Error determining login redirect for user`, error);
    return NextResponse.json(
      {
        error: 'Failed to determine login redirect',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
