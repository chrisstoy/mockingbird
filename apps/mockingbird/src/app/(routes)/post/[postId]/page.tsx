import { SkeletonSummaryPost } from '@/_components/SkeletonSummaryPost';
import { SummaryPost } from '@/_components/SummaryPost';
import { getPostWithId } from '@/_server/postsService';
import { PostId } from '@/_types';
import { Suspense } from 'react';

interface Props {
  params: Promise<{
    postId: PostId;
  }>;
}

export default async function PostDetailPage({ params }: Props) {
  const postId = (await params).postId;

  if (!postId) {
    return <div>No Post Specified</div>;
  }

  const post = await getPostWithId(postId);
  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="flex flex-col flex-auto bg-transparent">
      <Suspense fallback={<SkeletonSummaryPost></SkeletonSummaryPost>}>
        <SummaryPost post={post}></SummaryPost>
      </Suspense>
    </div>
  );
}
