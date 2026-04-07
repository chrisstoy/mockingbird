import { SkeletonPostHeader } from './SkeletonPostHeader';

export async function SkeletonSummaryPost() {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <SkeletonPostHeader />
      </div>
      <div className="px-4 pb-4">
        <div className="skeleton h-4 mb-2" />
        <div className="skeleton h-4 mb-2" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
