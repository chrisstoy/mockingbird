import { SkeletonPostHeader } from './SkeletonPostHeader';

export function SkeletonCommentReply() {
  return (
    <div className={`card-bordered card card-compact bg-base-100`}>
      <div className={`card-body rounded-lg`}>
        <SkeletonPostHeader small></SkeletonPostHeader>
        <div className="text-sm bg-transparent rounded-lg bg-base-200">
          <div className="skeleton h-4"></div>
          <div className="skeleton h-4"></div>
          <div className="skeleton h-4 w-2/3"></div>
        </div>
      </div>
    </div>
  );
}
