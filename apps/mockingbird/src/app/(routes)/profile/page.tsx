import { sessionUser } from '@/_hooks/sessionUser';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { ThemeSwitcher } from '@/_components/ThemeSwitcher.client';
import { DocumentTextIcon, KeyIcon, PaintBrushIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { DeleteAccountButton } from './_components/DeleteAccountButton.client';
import { ProfilePictureButton } from './_components/ProfilePictureButton.client';
import { SignOutButton } from './_components/SignOutButton.client';

function nameToHandle(name: string) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default async function UserProfilePage() {
  const user = await sessionUser();

  const userName = user?.name ?? 'Unknown';
  const email = user?.email;
  const imageSrc = user?.image ?? GENERIC_USER_IMAGE_URL;
  const handle = nameToHandle(userName);

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">

      {/* Profile card */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div
          className="h-28 w-full"
          style={{
            background:
              'linear-gradient(135deg, #F49D37 0%, #f7bc72 50%, #fde8c8 100%)',
          }}
        />

        {/* Avatar + name row */}
        <div className="px-6 pb-6">
          {/* Avatar — overlaps banner */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="ring-4 ring-base-100 rounded-2xl shadow-lg">
              <ProfilePictureButton currentImageSrc={imageSrc} />
            </div>
          </div>

          {/* Name + handle + email */}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-base-content leading-none">
              {userName}
            </h1>
            <p className="text-sm font-semibold text-base-content/40 tracking-wide">
              {handle}
            </p>
            <p className="text-sm text-base-content/50 mt-1">{email}</p>
          </div>
        </div>
      </div>

      {/* Appearance card */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-base-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/40">
            Appearance
          </h2>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-base-200 flex items-center justify-center shrink-0">
            <PaintBrushIcon className="w-4.5 h-4.5 text-base-content/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-base-content leading-none mb-0.5">
              Theme
            </p>
            <p className="text-xs text-base-content/40 mb-3">
              Choose light, dark, or match your OS
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Account settings card */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-base-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/40">
            Account Settings
          </h2>
        </div>

        {/* Change Password row */}
        <Link
          href="/profile/change-password"
          className="flex items-center gap-4 px-5 py-4 hover:bg-base-100 transition-colors border-b border-base-200 group"
        >
          <div className="w-9 h-9 rounded-xl bg-base-200 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <KeyIcon className="w-4.5 h-4.5 text-base-content/50 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-base-content leading-none mb-0.5">
              Change Password
            </p>
            <p className="text-xs text-base-content/40">
              Update your account password
            </p>
          </div>
          <span className="text-base-content/25 text-lg leading-none">›</span>
        </Link>

        {/* Sign out row */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-base-200">
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <UserCircleIcon className="w-4.5 h-4.5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-base-content leading-none mb-0.5">
              Sign Out
            </p>
            <p className="text-xs text-base-content/40">
              Sign out of your account
            </p>
          </div>
          <SignOutButton />
        </div>

        {/* Terms of Service */}
        <Link
          href="/privacy/tos"
          className="flex items-center gap-4 px-5 py-4 hover:bg-base-100 transition-colors border-b border-base-200 group"
        >
          <div className="w-9 h-9 rounded-xl bg-base-200 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
            <DocumentTextIcon className="w-4.5 h-4.5 text-base-content/50 group-hover:text-accent transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-base-content leading-none mb-0.5">
              Terms of Service
            </p>
            <p className="text-xs text-base-content/40">
              Review the terms governing your use
            </p>
          </div>
          <span className="text-base-content/25 text-lg leading-none">›</span>
        </Link>

        {/* Privacy Policy */}
        <Link
          href="/privacy/policy"
          className="flex items-center gap-4 px-5 py-4 hover:bg-base-100 transition-colors border-b border-base-200 group"
        >
          <div className="w-9 h-9 rounded-xl bg-base-200 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
            <ShieldCheckIcon className="w-4.5 h-4.5 text-base-content/50 group-hover:text-accent transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-base-content leading-none mb-0.5">
              Privacy Policy
            </p>
            <p className="text-xs text-base-content/40">
              Learn how your data is collected and used
            </p>
          </div>
          <span className="text-base-content/25 text-lg leading-none">›</span>
        </Link>

        {/* Danger zone */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-error/70 uppercase tracking-widest">
              Danger Zone
            </p>
            <p className="text-xs text-base-content/40 mt-0.5">
              Permanently delete your account and all data
            </p>
          </div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
