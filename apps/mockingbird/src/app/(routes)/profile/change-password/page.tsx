import { sessionUser } from '@/_hooks/sessionUser';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from './_components/ChangePasswordForm.client';

export default async function ChangePasswordPage() {
  const user = await sessionUser();
  if (!user) redirect('/auth/signin');

  return (
    <div className="hero bg-base-100 min-h-[60vh]">
      <div className="hero-content w-full max-w-md flex-col">
        <h1 className="text-3xl font-bold self-start">Change Password</h1>
        <ChangePasswordForm userId={user.id} />
      </div>
    </div>
  );
}
