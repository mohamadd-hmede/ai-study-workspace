import SignInCard from "@/components/SignInCard";
import Image from "next/image";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        {/* Brand panel */}
        <section className="relative overflow-hidden bg-gray-950 px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
          {/* Background glow */}
          <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex h-full min-h-[420px] flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/learnadio-logo.png"
                alt="Learnadio"
                width={44}
                height={44}
                priority
                className="h-11 w-11 object-contain"
              />

              <span className="text-2xl font-bold tracking-tight">
                Learnadio
              </span>
            </div>

            {/* Main content */}
            <div className="max-w-xl py-12 sm:py-16 lg:mt-28 lg:py-0">
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-300">
                AI-powered study workspace
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                Turn your materials
                <br />
                into <span className="text-blue-400">smarter study.</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-gray-300 sm:text-lg">
                Get summaries, quizzes, and AI answers from your course
                materials.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
                <span>✦ Summaries</span>
                <span>✦ Quizzes</span>
                <span>✦ AI answers</span>
              </div>
            </div>

            <p className="mt-auto hidden pb-6 text-sm text-gray-500 lg:block">
              Study with your materials, not around them.
            </p>
          </div>
        </section>

        {/* Sign-in panel */}
        <section className="relative hidden items-center justify-center overflow-hidden bg-gray-50 px-8 lg:flex">
          <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            <Suspense fallback={null}>
              <SignInCard />
            </Suspense>
          </div>
        </section>

        {/* Mobile sign-in */}
        <section className="bg-gray-950 px-6 pb-10 text-white lg:hidden">
          <div className="border-t border-white/10 pt-8">
            <Suspense fallback={null}>
              <SignInCard mobile />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
