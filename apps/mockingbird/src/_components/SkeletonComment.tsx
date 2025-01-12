import React from 'react';
import { SkeletonPostHeader } from './SkeletonPostHeader';

export async function SkeletonComment() {
  return (
    <div className={`card card-compact bg-base-100 shadow-md ml-4`}>
      <div className={`card-body rounded-lg`}>
        <div>
          <SkeletonPostHeader small></SkeletonPostHeader>
          <div className="text-sm bg-transparent rounded-lg">
            <div className="text-sm bg-transparent rounded-lg bg-base-200">
              <div className="skeleton h-4"></div>
              <div className="skeleton h-4"></div>
              <div className="skeleton h-4 w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
