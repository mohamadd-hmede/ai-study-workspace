"use client";

import { classifyPuterError } from "@/lib/puter-errors";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getCurrentUser,
  getDisplayName,
  setDisplayName,
  signIn,
} from "@/lib/puter";

type SignInCardProps = {
  mobile?: boolean;
};

export default function SignInCard({ mobile = false }: SignInCardProps) {
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

    try {
      const currentDisplayName = await getDisplayName();

      if (!currentDisplayName) {
        setNeedsDisplayName(true);
        return true;
      }

      try {
        await refreshDisplayName();
      } catch (displayNameRefreshError) {
        console.error(
          "Failed to refresh display name after sign in:",
          displayNameRefreshError,
        );
      }
    } catch (displayNameError) {
      console.error(
        "Failed to load display name after sign in:",
        displayNameError,
      );
    }

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
    } catch (signInError) {
      const classifiedError = classifyPuterError(signInError);

      if (classifiedError.category === "insufficient_balance") {
        setError(
          "Your Puter account has no usage remaining. Puter requires available usage to complete sign in.",
        );
        setIsSigningIn(false);
        return;
      }

      if (classifiedError.category === "auth_cancelled") {
        setError("Sign in was cancelled.");
        setIsSigningIn(false);
        return;
      }

      if (
        classifiedError.category === "network" ||
        classifiedError.category === "service_unavailable" ||
        classifiedError.category === "rate_limited"
      ) {
        setError(
          "Sign in is temporarily unavailable. Please try again in a moment.",
        );
        setIsSigningIn(false);
        return;
      }

      // Puter signIn can reject even when authentication actually completed.
      // Verify the resulting auth state before treating it as a failed sign in.
      try {
        const signedIn = await finishSignIn();

        if (!signedIn) {
          setError("Sign in could not be completed. Please try again.");
        }
      } catch (finishError) {
        console.error("Failed to verify sign in:", finishError);
        setError("Sign in could not be completed. Please try again.");
      } finally {
        setIsSigningIn(false);
      }

      return;
    }

    try {
      const signedIn = await finishSignIn();

      if (!signedIn) {
        setError("Sign in could not be completed. Please try again.");
      }
    } catch (finishError) {
      console.error("Failed to finish sign in:", finishError);

      const classifiedError = classifyPuterError(finishError);

      if (classifiedError.category === "insufficient_balance") {
        setError(
          "Your Puter account has no usage remaining. Sign in could not be completed.",
        );
      } else if (
        classifiedError.category === "network" ||
        classifiedError.category === "service_unavailable" ||
        classifiedError.category === "rate_limited"
      ) {
        setError(
          "Sign in is temporarily unavailable. Please try again in a moment.",
        );
      } else {
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

      try {
        await refreshDisplayName();
      } catch (refreshError) {
        console.error(
          "Failed to refresh display name after save:",
          refreshError,
        );
      }

      router.push(redirect);
    } catch (saveError) {
      console.error("Failed to save display name:", saveError);

      const classifiedError = classifyPuterError(saveError);

      if (classifiedError.category === "insufficient_balance") {
        setError(
          "Your Puter account has no usage remaining. Your name could not be saved.",
        );
        return;
      }

      if (
        classifiedError.category === "network" ||
        classifiedError.category === "service_unavailable" ||
        classifiedError.category === "rate_limited"
      ) {
        setError(
          "Your name could not be saved right now. Please try again in a moment.",
        );
        return;
      }

      if (classifiedError.category === "auth_required") {
        setError(
          "Your Puter session is no longer available. Please sign in again.",
        );
        return;
      }

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
            Welcome to Learnadio
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
    <div
      className={
        mobile
          ? "w-full"
          : "w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      }
    >
      <div className={mobile ? "text-left" : "text-center"}>
        <h2
          className={
            mobile
              ? "text-2xl font-bold text-white"
              : "text-2xl font-bold text-gray-900"
          }
        >
          Welcome to Learnadio
        </h2>

        <p
          className={
            mobile ? "mt-2 text-sm text-gray-400" : "mt-2 text-sm text-gray-600"
          }
        >
          Continue to your workspace.
        </p>
      </div>

      {error && (
        <p
          className={
            mobile
              ? "mt-5 text-sm text-red-400"
              : "mt-5 text-center text-sm text-red-600"
          }
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className={
          mobile
            ? "mt-6 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            : "mt-8 w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {isSigningIn ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
