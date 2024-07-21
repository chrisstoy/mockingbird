import Link from 'next/link';

export default async function NotFoundPage() {
  return (
    <div className="flex flex-auto justify-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl p-10">
        <h1 className="card-title justify-center">404 Not Found</h1>
        <div className="card-body">
          <p>
            We&apos;re sorry, but the page you are looking for is not in stock.
          </p>
          <div className="card-actions flex flex-col items-center">
            <Link href="/">Go Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
