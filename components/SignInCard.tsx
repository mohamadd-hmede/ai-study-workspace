"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signIn } from "@/lib/puter";

export default function SignInCard() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);

    try {
      await signIn();

      const user = await getCurrentUser();

      if (user) {
        router.push("/dashboard");
      }
    } catch {
      const user = await getCurrentUser();

      if (user) {
        router.push("/dashboard");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">Welcome</p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your workspace
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Access your courses, study materials, AI summaries, quizzes, and
          conversations.
        </p>
      </div>

      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? "Signing in..." : "Sign in with Puter"}
      </button>

      <p className="mt-4 text-center text-xs text-gray-500">
        Secure authentication powered by Puter.
      </p>
    </div>
  );
}
