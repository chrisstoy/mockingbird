import { toLocalTime } from '@/_apiServices/toLocalTime';
import { Audience, PostId } from '@/_types';
import { toCapitalized } from '@/_utils/toCapitalized';
import { PostMenu } from './PostMenu.client';

type Props = {
  date: Date;
  image: string;
  name: string;
  postId: PostId;

  isComment?: boolean;
  showOptionsMenu?: boolean;
  small?: boolean;
  audience?: Audience;
};

function nameToHandle(name: string) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function PostHeader({
  date,
  image,
  name,
  postId,
  audience,

  isComment = false,
  showOptionsMenu = false,
  small = false,
}: Props) {
  return (
    <div className="flex flex-row items-start">
      <div className="flex flex-row flex-auto gap-3">
        <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden flex-shrink-0`}>
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <div className={`font-bold text-base-content truncate ${small ? 'text-sm' : 'text-sm'}`}>
            {name}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-base-content/40">
            <span>{nameToHandle(name)}</span>
            <span>·</span>
            <span>{toLocalTime(date)}</span>
            {audience && (
              <>
                <span>·</span>
                <span>{toCapitalized(audience)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {showOptionsMenu && (
        <PostMenu isComment={isComment} postId={postId} />
      )}
    </div>
  );
}
