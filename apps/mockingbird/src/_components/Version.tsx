import { env } from '@/../env';
import version from '@/../version.json';

export function Version() {
  return (
    <p className="text-[10px] text-base-content/30 tracking-widest uppercase font-semibold">
      Mockingbird {version.version} - {env.VERCEL_ENV || env.NODE_ENV} -
      {` - Built: ${new Date(version.buildDate).toUTCString()}`}
      {env.VERCEL_GIT_COMMIT_REF ? ` - ${env.VERCEL_GIT_COMMIT_REF}` : ''}
    </p>
  );
}
