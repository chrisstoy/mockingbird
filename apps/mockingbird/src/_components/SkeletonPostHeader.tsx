import React from 'react';

type Props = {
  small?: boolean;
};

export function SkeletonPostHeader({ small = false }: Props) {
  return (
    <div className="flex flex-row">
      <div className="flex flex-row flex-auto">
        <div className="avatar">
          <div
            className={`${small ? 'h-8' : 'h-12'} rounded-full skeleton`}
          ></div>
        </div>
        <div className="flex flex-col ml-2 justify-center">
          <div className={`${small ? 'mb-0.5 text-sm' : 'mb-1 text-base'}`}>
            <div className="skeleton h-4 w-28"></div>
          </div>
          <div className={`${small ? 'text-xs' : 'text-sm'}`}>
            <div className="skeleton h-4 w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
