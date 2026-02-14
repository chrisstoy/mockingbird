import { Footer } from '@/_components/Footer';
import Image from 'next/image';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-lvh">
      <div className="flex flex-auto justify-center">
        <div className="card card-compact w-96 md:w-full bg-base-100 shadow-xl p-10 m-10 flex flex-col md:flex-row">
          <div className="justify-center flex flex-col flex-auto">
            <h1 className="text-center text-4xl">Welcome to Mockingbird</h1>
            <figure>
              <Image
                className="w-[192px] h-[192px] md:w-[256px] md:h-[256px]"
                src="/images/mockingbird-dark.png"
                alt="Mockingbird"
                width={256}
                height={256}
                priority
              />
            </figure>
          </div>
          <div className="card-body">{children}</div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}
