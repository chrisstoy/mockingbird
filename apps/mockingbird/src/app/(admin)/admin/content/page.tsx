import { getAllPostsForModeration } from '@/_server/adminService';
import { RouteParams } from '@/app/types';
import Link from 'next/link';
import { PostModerationTable } from './_components/PostModerationTable.client';

export default async function AdminContentPage({ searchParams }: RouteParams) {
  const sp = await searchParams;
  const page = Number(sp['page'] ?? '1');

  const { posts, total, limit } = await getAllPostsForModeration(page, 20);
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Content Moderation</h1>
      <PostModerationTable posts={posts} />

      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          {total} post{total !== 1 ? 's' : ''}
        </span>
        <div className="join">
          {page > 1 && (
            <Link
              href={`/admin/content?page=${page - 1}`}
              className="join-item btn btn-sm"
            >
              «
            </Link>
          )}
          <span className="join-item btn btn-sm btn-disabled">
            {page} / {Math.max(totalPages, 1)}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/content?page=${page + 1}`}
              className="join-item btn btn-sm"
            >
              »
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
