import { Post } from '@/_services/post';
import { auth } from '@/auth';
import Image from 'next/image';

type Props = {
  post: Post;
};

export async function SummaryPost({ post }: Props) {
  const session = await auth();

  const userName = session?.user?.name ?? 'Guy McFearson';
  const imageSrc = session?.user?.image ?? '/generic-user-icon.jpg';

  return (
    <div className="card bg-base-100 w-96 shadow-xl">
      <div className="card-body">
        <div className="flex flex-row">
          <Image
            src={imageSrc}
            alt="Profile Picture"
            width={50}
            height={50}
          ></Image>
          <div className="flex flex-col ml-2">
            <div className="mb-1">{userName}</div>
            <div className="text-xs">
              Posted on {post.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
        <p>{post.content}</p>
      </div>
    </div>
  );
}
