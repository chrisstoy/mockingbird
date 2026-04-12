import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col gap-6">
      <Image
        src="/images/mockingbird-logo.png"
        alt="Mockingbird"
        width={96}
        height={96}
        className="object-contain self-center"
        priority
      />

      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Down for Maintenance
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          We&apos;ll be back shortly
        </p>
      </div>

      <div role="alert" className="alert alert-warning w-full">
        <WrenchScrewdriverIcon className="h-5 w-5 shrink-0" />
        <span className="text-sm">
          Mockingbird is currently undergoing scheduled maintenance.
          Please check back soon.
        </span>
      </div>
    </div>
  );
}
