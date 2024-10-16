import { LocalTime } from '@/_components/LocalTime';
import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { CommentMenu } from './CommentMenu.client';
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
        <div className="flex flex-row">
          <div className="flex flex-row  flex-auto">
            <div className="avatar">
              <div className="h-6 rounded-full">
                <img src={imageSrc} alt="Profile Picture"></img>
              </div>
            </div>
            <div className="flex flex-col ml-2 justify-center">
              <div className="mb-1">{userName}</div>
              <div className="text-xs">
                Commented on <LocalTime date={post.createdAt}></LocalTime>
              </div>
            </div>
          </div>
          {showOptionsMenu && <CommentMenu post={post}></CommentMenu>}
        </div>
        <div className="text-sm p-2 bg-base-100 rounded-lg">{post.content}</div>
      </div>
    </div>
  );
}
