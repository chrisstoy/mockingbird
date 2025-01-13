import React from 'react';

export function SkeletonPostView() {
  return (
    <div className="p-2">
      <div className="flex flex-row">
        <div className="avatar">
          <div className="rounded-full">
            <div className="w-[42px] h-[42px] skeleton"></div>
          </div>
        </div>
        <div className="flex flex-col ml-2 justify-center">
          <div className="mb-1 skeleton"></div>
          <div className="text-xs skeleton"></div>
        </div>
      </div>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-2 skeleton"></div>
      </div>
    </div>
  );
}
