import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { PostHeader } from './PostHeader';
type Props = {
  post: Post;
};

export async function Comment({ post }: Props) {
  const session = await auth();
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';
  const showOptionsMenu = post.posterId === session?.user?.id;

  return (
    <div className="card card-compact shadow-md">
      <div className="card-body">
        <PostHeader
          name={userName}
          image={imageSrc}
          date={post.createdAt}
          postId={post.id}
          small
          isComment
          showOptionsMenu={showOptionsMenu}
        ></PostHeader>
        <div className="text-sm p-2 bg-base-100 rounded-lg">{post.content}</div>
      </div>
    </div>
  );
}
