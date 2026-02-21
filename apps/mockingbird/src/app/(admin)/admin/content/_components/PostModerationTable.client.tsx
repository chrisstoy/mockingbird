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

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      await adminDeletePost(postId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Poster</th>
            <th>Content</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="font-medium">{post.poster.name}</td>
              <td className="max-w-xs truncate text-sm">{post.content}</td>
              <td className="text-xs">
                {new Date(post.createdAt).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="btn btn-error btn-xs"
                  disabled={deletingId === post.id}
                  onClick={() => handleDelete(post.id)}
                >
                  {deletingId === post.id ? '…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-base-content/50">
                No posts
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
