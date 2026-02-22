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
    <div className="p-8 max-w-5xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-1">
            Moderation
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        </div>
        <span className="text-sm text-base-content/50">
          {total} post{total !== 1 ? 's' : ''}
        </span>
      </div>

      <PostModerationTable posts={posts} />

      <div className="flex justify-between items-center mt-5 text-sm">
        <span className="text-base-content/50">
          Page {page} of {Math.max(totalPages, 1)}
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
          <span className="join-item btn btn-sm btn-disabled pointer-events-none">
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
