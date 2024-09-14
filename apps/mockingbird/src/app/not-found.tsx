import Link from 'next/link';
import Image from 'next/image';

export default async function NotFoundPage() {
  return (
    <div className="flex flex-auto justify-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl p-10 m-10">
        <h1 className="text-center text-4xl">Page not Found</h1>
        <figure>
          <Image
            src="/mockingbird-dark.png"
            alt="Mockingbird"
            width={256}
            height={256}
          />
        </figure>
        <div className="card-body">
          <div className="flex flex-col text-center">
            <div className="mb-4">
              This page appears to have flown the coop.
            </div>
            <div className="card-actions flex flex-col items-center">
              <Link className="link link-hover" href="/">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
