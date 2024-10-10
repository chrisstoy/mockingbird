import Image from 'next/image';

type Props = {
  imageSrc: string;
  userName: string;
  content: string;
  createdAt: Date;
};

export function PostView({ imageSrc, userName, content, createdAt }: Props) {
  return (
    <div>
      <div className="flex flex-row">
        <div className="avatar">
          <div className="rounded-full">
            <Image
              src={imageSrc}
              alt="Profile Picture"
              width={42}
              height={42}
            ></Image>
          </div>
        </div>
        <div className="flex flex-col ml-2 justify-center">
          <div className="mb-1">{userName}</div>
          <div className="text-xs">Posted on {createdAt.toLocaleString()}</div>
        </div>
      </div>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">{content}</div>
      </div>
    </div>
  );
}
