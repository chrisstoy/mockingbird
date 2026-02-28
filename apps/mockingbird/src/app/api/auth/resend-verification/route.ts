import { initiateEmailVerification } from '@/_server/usersService';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { UserId } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await validateAuthentication();

    if (session.user.status !== 'PENDING_EMAIL_VERIFICATION') {
      throw new ResponseError(400, 'Email verification not required');
    }

    const baseUrl = request.nextUrl.origin;
    await initiateEmailVerification(session.user.id as UserId, baseUrl);

    return NextResponse.json({ message: 'Verification email sent' }, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
