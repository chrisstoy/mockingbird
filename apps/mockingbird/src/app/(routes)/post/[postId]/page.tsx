import { SummaryPost } from '@/_components/SummaryPost';
import { getPostWithId } from '@/_services/post';

interface Props {
  params: {
    postId: string;
  };
}

export default async function PostDetailPage({ params }: Props) {
  const postId = params.postId;

  if (!postId) {
    return <div>No Post Specified</div>;
  }

  const post = await getPostWithId(postId);
  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="flex flex-col flex-auto bg-transparent">
      <SummaryPost post={post}></SummaryPost>
    </div>
  );
}
