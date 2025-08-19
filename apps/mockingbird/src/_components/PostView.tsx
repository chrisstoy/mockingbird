import { Post } from '@/_types';
import { TextDisplay } from '@mockingbird/stoyponents';
import Image from 'next/image';
import { ImageDisplay } from './ImageDisplay.client';
import { LocalTime } from './LocalTime.client';

type Props = {
  posterInfo: {
    userName: string;
    imageSrc: string;
  };
  post: Post;
};

export function PostView({ posterInfo, post }: Props) {
  return (
    <div className="p-2">
      <div className="flex flex-row">
        <div className="avatar">
          <div className="rounded-full">
            <Image
              src={posterInfo.imageSrc}
              alt="Profile Picture"
              width={42}
              height={42}
            ></Image>
          </div>
        </div>
        <div className="flex flex-col ml-2 justify-center">
          <div className="mb-1">{posterInfo.userName}</div>
          <div className="text-xs">
            Posted on <LocalTime date={post.createdAt}></LocalTime>
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-2">
          <ImageDisplay imageId={post.imageId}></ImageDisplay>
          <TextDisplay data={post.content}></TextDisplay>
        </div>
      </div>
    </div>
  );
}
