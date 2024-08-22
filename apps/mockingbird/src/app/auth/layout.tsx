import Image from 'next/image';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-auto justify-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl p-10 m-10">
        <h1 className="text-center text-4xl">Welcome to Mockingbird</h1>
        <figure>
          <Image
            src="/mockingbird-dark.png"
            alt="Mockingbird"
            width={256}
            height={256}
          />
        </figure>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
