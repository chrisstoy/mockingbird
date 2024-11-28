import { env } from '@/../env.mjs';
import version from '@/../version.json';

export function Footer() {
  return (
    <div className="m-2 bg-neutral text-neutral-content w-full text-left">
      <div className="text-[8px]">
        Mockingbird {version.version} - {env.NODE_ENV || env.VECEL_ENV} -{' '}
        {new Date(version.buildDate).toLocaleString()}
      </div>
    </div>
  );
}
