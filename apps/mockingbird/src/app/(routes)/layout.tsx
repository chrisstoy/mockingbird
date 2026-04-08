import { AppFooter } from '@/_components/AppFooter';
import { AppHeader } from '@/_components/AppHeader';
import { LeftSidebar } from '@/_components/LeftSidebar.client';
import { MobileBottomNav } from '@/_components/MobileBottomNav.client';
import { MobileHeader } from '@/_components/MobileHeader';
import { RightSidebar } from '@/_components/RightSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mockingbird',
  description: 'Basic Social Media App',
};

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Desktop header — hidden on mobile */}
      <div className="hidden lg:block">
        <AppHeader />
      </div>

      {/* Mobile header — hidden on desktop */}
      <MobileHeader />

      <LeftSidebar />

      <main className="lg:ml-60 lg:mr-60 min-h-screen">
        <div className="px-4 md:px-6 pt-28 lg:pt-20 pb-32 lg:pb-14">
          {children}
        </div>
      </main>

      <RightSidebar />
      <MobileBottomNav />
      <AppFooter />
    </div>
  );
}
