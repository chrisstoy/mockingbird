import { toLocalTime } from '@/_apiServices/toLocalTime';
import { PostId } from '@/_types/post';
import { PostMenu } from './PostMenu.client';

type Props = {
  date: Date;
  image: string;
  name: string;
  postId: PostId;

  isComment?: boolean;
  showOptionsMenu?: boolean;
  small?: boolean;
};

export function PostHeader({
  date,
  image,
  name,
  postId,

  isComment = false,
  showOptionsMenu = false,
  small = false,
}: Props) {
  return (
    <div className="flex flex-row">
      <div className="flex flex-row flex-auto">
        <div className="avatar">
          <div className={`${small ? 'h-8' : 'h-12'} rounded-full`}>
            {/* eslint-disable-next-line @next/next/no-img-element*/}
            <img src={image} alt="Profile Picture"></img>
          </div>
        </div>
        <div className="flex flex-col ml-2 justify-center">
          <div className={`${small ? 'mb-0.5 text-sm' : 'mb-1 text-base'}`}>
            {name}
          </div>
          <div className={`${small ? 'text-xs' : 'text-sm'}`}>
            {`${isComment ? 'Commented' : 'Posted'} on ${toLocalTime(date)}`}
          </div>
        </div>
      </div>
      {showOptionsMenu && (
        <PostMenu isComment={isComment} postId={postId}></PostMenu>
      )}
    </div>
  );
}
