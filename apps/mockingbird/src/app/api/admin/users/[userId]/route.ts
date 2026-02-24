import {
  adminDeleteUser,
  updateUserRole,
} from '@/_server/adminService';
import { getUserById } from '@/_server/usersService';
import { UserIdSchema, UserRoleSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ResponseError, respondWithError } from '../../../errors';
import { validatePermission } from '../../../validateAuthentication';

const ParamsSchema = z.object({ userId: UserIdSchema });

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await validatePermission('users:view');
    const { userId } = ParamsSchema.parse(await context.params);
    const user = await getUserById(userId);
    if (!user) throw new ResponseError(404, `User '${userId}' not found`);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

const PutBodySchema = z.object({ role: UserRoleSchema });

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('users:edit');
    const { userId } = ParamsSchema.parse(await context.params);
    const { role } = PutBodySchema.parse(await req.json());

    const updated = await updateUserRole(userId, role, session.user.id);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('users:delete');
    const { userId } = ParamsSchema.parse(await context.params);
    await adminDeleteUser(userId, session.user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
