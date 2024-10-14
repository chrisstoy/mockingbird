import { CommentList } from '@/_components/CommentList';
import { SummaryPost } from '@/_components/SummaryPost';
import { getCommentsForPost, getPostWithId } from '@/_services/post';
import { auth } from '@/app/auth';

export default async function PostDetailPage({
  params,
}: {
  params: { postId: string };
}) {
  const session = await auth();

  const postId = params.postId;

  if (!postId) {
    return <div>No Post Specified</div>;
  }

  const post = await getPostWithId(postId);
  if (!post) {
    return <div>Post not found</div>;
  }

  const comments = (await getCommentsForPost(postId)) ?? [];

  return (
    <div className="flex flex-col flex-auto bg-base-200">
      <SummaryPost post={post}></SummaryPost>
      <CommentList feed={comments}></CommentList>
    </div>
  );
}
