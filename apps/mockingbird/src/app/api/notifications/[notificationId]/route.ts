import { markNotificationRead } from '@/_server/notificationService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const PatchSchema = z.object({ read: z.literal(true) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    await validateAuthentication();
    const { notificationId } = await params;
    PatchSchema.parse(await req.json());
    await markNotificationRead(notificationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
