import Link from 'next/link';

export default async function PrivacyPage() {
  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <Link href="privacy/tos" className="btn btn-primary">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
