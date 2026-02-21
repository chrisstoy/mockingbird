import { getAuditLog } from '@/_server/adminService';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError } from '../../errors';
import { validatePermission } from '../../validateAuthentication';

export async function GET(req: NextRequest) {
  try {
    await validatePermission('admin:access');

    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');

    const result = await getAuditLog(page, limit);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
