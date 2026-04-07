import { Footer } from '@/_components/Footer';
import Image from 'next/image';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Brand Panel — dark, sticky on desktop */}
      <aside className="relative overflow-hidden bg-neutral text-neutral-content flex-shrink-0 flex flex-row items-center gap-4 px-6 py-5 md:flex-col md:items-center md:justify-center md:w-[400px] lg:w-[440px] md:h-screen md:sticky md:top-0 md:gap-6 md:px-12 md:py-16">
        {/* Subtle orange radial glow */}
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 38%, rgba(244,157,55,0.09) 0%, transparent 70%)',
          }}
        />
        {/* Right edge accent bar */}
        <div className="hidden md:block absolute right-0 top-[15%] bottom-[15%] w-0.5 rounded-full bg-gradient-to-b from-transparent via-primary/60 to-transparent" />

        <Image
          src="/images/mockingbird-dark.png"
          alt="Mockingbird"
          width={160}
          height={160}
          className="relative z-10 w-10 h-10 md:w-36 md:h-36 object-contain"
          priority
        />

        <div className="relative z-10 md:text-center">
          <div className="font-extrabold tracking-tight text-xl md:text-[2rem] lg:text-[2.25rem] leading-none text-neutral-content">
            Mockingbird
          </div>
          <p className="hidden md:block mt-3 text-sm leading-relaxed text-neutral-content/55 font-light max-w-[210px] mx-auto">
            Your community of authentic voices.
          </p>
        </div>

        {/* Orange accent dots */}
        <div className="hidden md:flex items-center gap-2 mt-1">
          <div className="h-px w-8 bg-primary/40 rounded-full" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <div className="h-px w-8 bg-primary/40 rounded-full" />
        </div>
      </aside>

      {/* Form Panel */}
      <main className="flex-1 flex flex-col bg-base-100">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
