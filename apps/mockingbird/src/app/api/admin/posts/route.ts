import { getAllPostsForModeration } from '@/_server/adminService';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError } from '../../errors';
import { validatePermission } from '../../validateAuthentication';

export async function GET(req: NextRequest) {
  try {
    await validatePermission('posts:view_all');

    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');

    const result = await getAllPostsForModeration(page, limit);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
