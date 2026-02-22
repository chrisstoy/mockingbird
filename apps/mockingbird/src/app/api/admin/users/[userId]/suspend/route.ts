import { suspendUser, unsuspendUser } from '@/_server/adminService';
import { UserIdSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../../../../errors';
import { validatePermission } from '../../../../validateAuthentication';

const ParamsSchema = z.object({ userId: UserIdSchema });
const SuspendBodySchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required'),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('users:suspend');
    const { userId } = ParamsSchema.parse(await context.params);
    const body = await req.json();
    const { reason } = SuspendBodySchema.parse(body);
    const user = await suspendUser(userId, session.user.id, reason);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('users:suspend');
    const { userId } = ParamsSchema.parse(await context.params);
    const user = await unsuspendUser(userId, session.user.id);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
