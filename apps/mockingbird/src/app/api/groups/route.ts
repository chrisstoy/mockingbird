import { createGroup, searchGroups } from '@/_server/groupService';
import { CreateGroupSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

export async function GET(req: NextRequest) {
  try {
    await validateAuthentication();
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const groups = await searchGroups(q);
    return NextResponse.json(groups);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();
    const ownerId = UserIdSchema.parse(session.user?.id);
    const body = CreateGroupSchema.parse(await req.json());
    const group = await createGroup(ownerId, body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
