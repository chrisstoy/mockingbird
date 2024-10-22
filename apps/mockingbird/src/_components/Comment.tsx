import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import Link from 'next/link';
import { PostHeader } from './PostHeader';

type Props = {
  post: Post;
  originalPostId: string;
  linkToDetails?: boolean;
};

export async function Comment({
  post,
  originalPostId,
  linkToDetails = false,
}: Props) {
  const session = await auth();
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';
  const showOptionsMenu = post.posterId === session?.user?.id;

  const renderContent = () => (
    <>
      <PostHeader
        name={userName}
        image={imageSrc}
        date={post.createdAt}
        postId={post.id}
        small
        isComment
        showOptionsMenu={showOptionsMenu}
      ></PostHeader>
      <div className="text-sm p-2 bg-transparent rounded-lg">
        <div>{post.content}</div>
      </div>
    </>
  );

  return (
    <div className={`card card-compact bg-base-100 shadow-md`}>
      <div
        className={`card-body rounded-lg ${
          linkToDetails && 'hover:bg-base-200'
        }`}
      >
        {linkToDetails ? (
          <Link href={`/post/${originalPostId}`}>{renderContent()}</Link>
        ) : (
          <div>{renderContent()}</div>
        )}
      </div>
    </div>
  );
}
