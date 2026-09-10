"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getCurrentUser, signIn } from "@/lib/puter";

export default function SignInCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);

  const redirectParam = searchParams.get("redirect");

  const redirect =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//")
      ? redirectParam
      : "/dashboard";

  const handleSignIn = async () => {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);

    try {
      await signIn();

      const user = await getCurrentUser();

      if (user) {
        await refreshUser();
        router.push(redirect);
      }
    } catch {
      const user = await getCurrentUser();

      if (user) {
        await refreshUser();
        router.push(redirect);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>

        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to your study workspace.
        </p>
      </div>

      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="mt-8 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSigningIn ? "Signing in..." : "Sign in with Puter"}
      </button>
    </div>
  );
}
