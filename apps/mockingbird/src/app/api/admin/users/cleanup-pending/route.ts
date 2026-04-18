import { deleteExpiredPendingAccounts } from '@/_server/adminService';
import { NextResponse } from 'next/server';
import { respondWithError } from '../../../errors';
import { validatePermission } from '../../../validateAuthentication';

export async function DELETE() {
  try {
    const session = await validatePermission('users:delete');
    const result = await deleteExpiredPendingAccounts(session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return respondWithError(error);
  }
}
