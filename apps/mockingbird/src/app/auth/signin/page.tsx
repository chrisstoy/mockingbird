import { SignInForm } from './_components/SignInForm.client';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl">Sign In</h2>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
