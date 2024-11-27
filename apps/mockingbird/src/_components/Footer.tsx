import { env } from '@/../env.mjs';
import { buildDate, version } from '@/../version.mjs';

export function Footer() {
  return (
    <div className="m-2 bg-neutral text-neutral-content w-full text-left">
      <div className="text-xs">
        Mockingbird {version} - {env.NODE_ENV || env.VECEL_ENV} - {buildDate}
      </div>
    </div>
  );
}
