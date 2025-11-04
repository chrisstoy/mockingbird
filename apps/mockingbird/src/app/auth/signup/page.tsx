import { SignUpForm } from './_components/SignUpForm.client';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl">Create Account</h2>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
