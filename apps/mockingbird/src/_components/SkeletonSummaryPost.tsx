import React from 'react';
import { SkeletonPostHeader } from './SkeletonPostHeader';

export async function SkeletonSummaryPost() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <SkeletonPostHeader></SkeletonPostHeader>
        <div className={`card bg-base-100 shadow-md`}>
          <div className="card-body h-28">
            <div className="skeleton h-4"></div>
            <div className="skeleton h-4"></div>
            <div className="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
