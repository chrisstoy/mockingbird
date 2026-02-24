import Link from 'next/link';

export default async function PrivacyPage() {
  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body gap-3">
          <Link href="privacy/policy" className="btn btn-outline">
            View Privacy Policy
          </Link>
          <Link href="privacy/tos" className="btn btn-outline">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
