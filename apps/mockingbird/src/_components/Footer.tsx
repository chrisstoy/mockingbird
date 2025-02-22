import { env } from '@/../env';
import version from '@/../version.json';

export function Footer() {
  return (
    <div className="m-2 bg-neutral text-neutral-content w-full text-left">
      <div className="text-[8px]">
        Mockingbird {version.version} - {env.NODE_ENV || env.VERCEL_ENV} -
        {` - Built: ${new Date(version.buildDate).toUTCString()}`}
        {env.VERCEL_GIT_PULL_REQUEST_ID
          ? ` - PR${env.VERCEL_GIT_PULL_REQUEST_ID}`
          : ''}{' '}
      </div>
    </div>
  );
}
