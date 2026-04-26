import { getNotificationsForUser } from '@/_server/notificationService';
import { UserIdSchema } from '@/_types';
import { NextResponse } from 'next/server';
import { respondWithError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

export async function GET() {
  try {
    const session = await validateAuthentication();
    const userId = UserIdSchema.parse(session.user?.id);
    const notifications = await getNotificationsForUser(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    return respondWithError(error);
  }
}
