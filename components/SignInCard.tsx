"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getCurrentUser,
  getDisplayName,
  setDisplayName,
  signIn,
} from "@/lib/puter";

export default function SignInCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { refreshUser, refreshDisplayName } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [needsDisplayName, setNeedsDisplayName] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectParam = searchParams.get("redirect");

  const redirect =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//")
      ? redirectParam
      : "/dashboard";

  const finishSignIn = async () => {
    const user = await getCurrentUser();

    if (!user) {
      return false;
    }

    await refreshUser();

    const currentDisplayName = await getDisplayName();

    if (!currentDisplayName) {
      setNeedsDisplayName(true);
      return true;
    }

    await refreshDisplayName();
    router.push(redirect);

    return true;
  };

  const handleSignIn = async () => {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      await signIn();
      await finishSignIn();
    } catch {
      const signedIn = await finishSignIn();

      if (!signedIn) {
        setError("Sign in could not be completed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Your name must be 50 characters or fewer.");
      return;
    }

    setIsSavingName(true);
    setError(null);

    try {
      await setDisplayName(trimmedName);
      await refreshDisplayName();

      router.push(redirect);
    } catch (error) {
      console.error("Failed to save display name:", error);
      setError("Your name could not be saved. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  if (needsDisplayName) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to StudyFlow
          </h2>

          <p className="mt-2 text-sm text-gray-600">What should we call you?</p>
        </div>

        <form onSubmit={handleSaveName} className="mt-8">
          <label
            htmlFor="display-name"
            className="block text-sm font-medium text-gray-700"
          >
            Display name
          </label>

          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            autoComplete="name"
            maxLength={50}
            disabled={isSavingName}
            autoFocus
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSavingName}
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingName ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>

        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to your study workspace.
        </p>
      </div>

      {error && (
        <p className="mt-5 text-center text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="mt-8 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSigningIn ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
