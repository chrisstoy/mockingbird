import { markAllNotificationsRead } from '@/_server/notificationService';
import { UserIdSchema } from '@/_types';
import { NextResponse } from 'next/server';
import { respondWithError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

export async function PATCH() {
  try {
    const session = await validateAuthentication();
    const userId = UserIdSchema.parse(session.user?.id);
    await markAllNotificationsRead(userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
