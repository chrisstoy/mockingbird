import {
  getUserPermissionOverrides,
  setUserPermissionOverrides,
} from '@/_server/adminService';
import { UserIdSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../../../../errors';
import { validatePermission } from '../../../../validateAuthentication';

const ParamsSchema = z.object({ userId: UserIdSchema });

const OverridesSchema = z.object({
  overrides: z.array(
    z.object({ permission: z.string(), granted: z.boolean() })
  ),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await validatePermission('users:permissions');
    const { userId } = ParamsSchema.parse(await context.params);
    const overrides = await getUserPermissionOverrides(userId);
    return NextResponse.json(overrides, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('users:permissions');
    const { userId } = ParamsSchema.parse(await context.params);
    const { overrides } = OverridesSchema.parse(await req.json());
    await setUserPermissionOverrides(userId, overrides, session.user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
