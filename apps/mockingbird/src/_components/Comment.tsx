import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { PostHeader } from './PostHeader';

type Props = {
  post: Post;
  originalPost: Post;
  linkToDetails?: boolean;
  hideOptionsMenu?: boolean;
};

export async function Comment({
  post,
  originalPost,
  linkToDetails = false,
  hideOptionsMenu = false,
}: Props) {
  const session = await auth();
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';
  const showOptionsMenu =
    post.posterId === session?.user?.id ||
    originalPost.posterId === session?.user?.id;

  const renderContent = () => (
    <>
      <PostHeader
        name={userName}
        image={imageSrc}
        date={post.createdAt}
        postId={post.id}
        small
        isComment
        showOptionsMenu={!hideOptionsMenu && showOptionsMenu}
      ></PostHeader>
      <div className="text-sm bg-transparent rounded-lg">
        <TextDisplay content={post.content}></TextDisplay>
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
          <Link href={`/post/${originalPost.id}`}>{renderContent()}</Link>
        ) : (
          <div>{renderContent()}</div>
        )}
      </div>
    </div>
  );
}
