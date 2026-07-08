import { Suspense } from "react";

import Image from "next/image";

import { LoginForm } from "./_components/login-form";

// Colors mirror the public website's palette (cream / stone / sage).
export default function StudioLogin() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-[#ebf0ec] lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image
              src="/images/logo.png"
              alt="Sandnes Soneterapi"
              width={160}
              height={160}
              priority
              className="mx-auto"
            />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-[#3d3530]">Velkommen tilbake</h1>
              <p className="text-[#5c524c] text-xl">Logg inn for å fortsette</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-[#faf7f2] p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium text-[#3d3530] tracking-tight">Logg inn</div>
            <div className="mx-auto max-w-xl text-[#5c524c]">
              Skriv inn e-postadressen og passordet ditt for å få tilgang til administrasjonspanelet.
            </div>
          </div>
          <div className="space-y-4">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
