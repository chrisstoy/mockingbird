'use client';
import { adminDeletePost } from '@/_apiServices/admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Post {
  id: string;
  content: string;
  createdAt: string | Date;
  poster: { id: string; name: string };
}

export function PostModerationTable({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    setConfirmId(null);
    try {
      await adminDeletePost(postId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-sm table-zebra w-full">
        <thead>
          <tr className="bg-base-200">
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Poster</th>
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Content</th>
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="hover">
              <td className="font-medium whitespace-nowrap">{post.poster.name}</td>
              <td className="max-w-xs">
                <span className="line-clamp-2 text-sm text-base-content/70">
                  {post.content}
                </span>
              </td>
              <td className="text-xs text-base-content/50 whitespace-nowrap">
                {new Date(post.createdAt).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap">
                {confirmId === post.id ? (
                  <div className="flex gap-1 items-center">
                    <button
                      className="btn btn-error btn-xs"
                      disabled={deletingId === post.id}
                      onClick={() => handleDelete(post.id)}
                    >
                      {deletingId === post.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        'Confirm'
                      )}
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost btn-xs text-error hover:btn-error"
                    onClick={() => setConfirmId(post.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-base-content/40 py-8">
                No posts to moderate
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
