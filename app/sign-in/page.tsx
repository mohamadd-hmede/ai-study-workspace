import SignInCard from "@/components/SignInCard";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden bg-gray-900 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">AppName</h1>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-medium text-blue-300">
              AI-powered study workspace
            </p>

            <h2 className="mt-4 text-5xl font-bold leading-tight">
              Turn your course materials into a smarter study experience.
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              Organize your courses, upload learning materials, generate
              summaries and quizzes, and ask AI questions about what you are
              studying.
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Study with your materials, not around them.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12">
          <Suspense fallback={null}>
            <SignInCard />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
