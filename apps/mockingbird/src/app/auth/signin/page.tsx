import Image from 'next/image';
import { Suspense } from 'react';
import { SignInForm } from './_components/SignInForm.client';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-5xl w-full">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center  gap-6 md:flex-1">
          <Image
            src="/images/mockingbird-dark.png"
            alt="Mockingbird Logo"
            width={200}
            height={200}
            className="block dark:hidden"
            priority
          />
          <Image
            src="/images/mockingbird-white.png"
            alt="Mockingbird Logo"
            width={200}
            height={200}
            className="hidden dark:block"
            priority
          />
          <h1 className="text-secondary-content text-4xl md:text-5xl font-bold text-center">
            Welcome to Mockingbird
          </h1>
        </div>

        {/* Sign In Form Section */}
        <div className="card w-full md:w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title justify-center text-2xl">Sign In</h2>
            <Suspense fallback={<div>Loading...</div>}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
