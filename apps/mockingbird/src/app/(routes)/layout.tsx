import { Footer } from '@/_components/Footer';
import { Header } from '@/_components/Header';
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
    <div className="flex flex-col h-lvh">
      <Header></Header>
      <div className="justify-center flex flex-auto overflow-y-auto">
        <div className="container max-w-2xl">{children}</div>
      </div>
      <Footer></Footer>
    </div>
  );
}
