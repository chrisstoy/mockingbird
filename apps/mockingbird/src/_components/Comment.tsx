import { getUser } from '@/_services/users';
import { LocalTime } from '@/_components/LocalTime';
import { Post } from '@/_types/post';

type Props = {
  post: Post;
};

export async function Comment({ post }: Props) {
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';

  return (
    <div className="card card-compact shadow-md">
      <div className="card-body">
        <div className="flex flex-row">
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
        <div className="text-sm p-2 bg-base-100 rounded-lg">{post.content}</div>
      </div>
    </div>
  );
}
