"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Cloud,
  Crown,
  ExternalLink,
  HardDrive,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import {
  getMonthlyUsage,
  getStorageSpace,
  requestPlanUpgrade,
  setDisplayName,
} from "@/lib/puter";
import { classifyPuterError } from "@/lib/puter-errors";

type AccountUsage = {
  used: number;
  allowance: number;
  remaining: number;
};

type StorageUsage = {
  used: number;
  capacity: number;
};

type SubscriptionInfo = {
  tier?: string;
  active?: boolean;
  status?: string;
};

type UserWithSubscription = {
  subscription?: SubscriptionInfo;
};

const getInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

const formatCredits = (credits: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(credits);
};

const getPercentage = (used: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (used / total) * 100));
};

export default function ProfilePage() {
  const router = useRouter();

  const { user, displayName, authStatus, refreshUser, refreshDisplayName } =
    useAuth();

  const [usage, setUsage] = useState<AccountUsage | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  const [usageLoading, setUsageLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [usageError, setUsageError] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [authStatus, router]);

  const loadUsage = useCallback(async () => {
    try {
      setUsageLoading(true);
      setUsageError(false);

      const monthlyUsage = await getMonthlyUsage();

      const allowance = monthlyUsage.allowanceInfo.monthUsageAllowance;
      const remaining = monthlyUsage.allowanceInfo.remaining;

      setUsage({
        used: Math.max(0, allowance - remaining),
        allowance,
        remaining,
      });
    } catch (error) {
      console.error("Failed to load resource usage:", error);
      setUsageError(true);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const loadStorage = useCallback(async () => {
    try {
      setStorageLoading(true);
      setStorageError(false);

      const storageSpace = await getStorageSpace();

      setStorage({
        used: storageSpace.used,
        capacity: storageSpace.capacity,
      });
    } catch (error) {
      console.error("Failed to load storage usage:", error);
      setStorageError(true);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadAccountData = async () => {
      await Promise.allSettled([loadUsage(), loadStorage()]);
    };

    const timeoutId = window.setTimeout(() => {
      void loadAccountData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, loadUsage, loadStorage]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setActionError(null);

      await Promise.all([
        refreshUser(),
        refreshDisplayName(),
        loadUsage(),
        loadStorage(),
      ]);
    } catch (error) {
      console.error("Failed to refresh account:", error);

      setActionError(
        "Your account information could not be refreshed. Please try again.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgradeLoading(true);
      setActionError(null);

      await requestPlanUpgrade();

      await Promise.all([
        refreshUser(),
        refreshDisplayName(),
        loadUsage(),
        loadStorage(),
      ]);
    } catch (error) {
      console.error("Failed to open upgrade flow:", error);

      setActionError(
        "The upgrade window could not be opened. Please try again.",
      );
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleStartEditingName = () => {
    setEditedName(displayName ?? "");
    setNameError(null);
    setEditingName(true);
  };

  const handleCancelEditingName = () => {
    setEditedName("");
    setNameError(null);
    setEditingName(false);
  };

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();

    if (!trimmedName) {
      setNameError("Please enter your name.");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Your name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 50) {
      setNameError("Your name must be 50 characters or fewer.");
      return;
    }

    if (trimmedName === displayName) {
      setEditingName(false);
      setNameError(null);
      return;
    }

    try {
      setSavingName(true);
      setNameError(null);

      await setDisplayName(trimmedName);

      try {
        await refreshDisplayName();
      } catch (refreshError) {
        console.error(
          "Failed to refresh display name after update:",
          refreshError,
        );
      }

      setEditingName(false);
      setEditedName("");
    } catch (saveError) {
      console.error("Failed to update display name:", saveError);

      const classifiedError = classifyPuterError(saveError);

      if (classifiedError.category === "insufficient_balance") {
        setNameError(
          "Your Puter account has no usage remaining. Your name could not be updated.",
        );
        return;
      }

      if (
        classifiedError.category === "network" ||
        classifiedError.category === "service_unavailable" ||
        classifiedError.category === "rate_limited"
      ) {
        setNameError(
          "Your name could not be updated right now. Please try again in a moment.",
        );
        return;
      }

      if (classifiedError.category === "auth_required") {
        setNameError(
          "Your Puter session is no longer available. Please sign in again.",
        );
        return;
      }

      setNameError("Your name could not be updated. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const openPuterBilling = () => {
    window.open(
      "https://puter.com/dashboard#billing",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openPuterAccount = () => {
    window.open(
      "https://puter.com/dashboard#account",
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (authStatus === "error" && !user) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-950">
            We couldn&apos;t verify your session
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleName = displayName || "Learnadio User";
  const initials = getInitials(visibleName);

  const subscribed = user.subscribed === true;

  const subscription = (user as UserWithSubscription).subscription;

  const planName = subscription?.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : subscribed
      ? "Subscription"
      : "Free";

  const planActive =
    subscription?.active === true || subscription?.status === "active";

  const resourcePercentage = usage
    ? getPercentage(usage.used, usage.allowance)
    : 0;

  const storagePercentage = storage
    ? getPercentage(storage.used, storage.capacity)
    : 0;

  const storageRemaining = storage
    ? Math.max(0, storage.capacity - storage.used)
    : 0;

  const highResourceUsage = resourcePercentage >= 80;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Profile
          </h1>

          <p className="mt-2 text-base text-slate-500">
            Manage your Learnadio account, plan, and usage.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 flex-col items-start gap-4 min-[360px]:flex-row min-[360px]:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <div>
                    <label htmlFor="profile-display-name" className="sr-only">
                      Display name
                    </label>

                    <input
                      id="profile-display-name"
                      type="text"
                      value={editedName}
                      onChange={(event) => {
                        setEditedName(event.target.value);

                        if (nameError) {
                          setNameError(null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          handleCancelEditingName();
                        }
                      }}
                      maxLength={50}
                      autoComplete="name"
                      autoFocus
                      disabled={savingName}
                      className="h-11 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    {nameError && (
                      <p className="mt-2 text-sm text-red-600">{nameError}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />

                        {savingName ? "Saving..." : "Save"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEditingName}
                        disabled={savingName}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="break-words text-xl font-semibold text-slate-950 sm:text-2xl">
                      {visibleName}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{planName} plan</span>

                      {planActive && (
                        <>
                          <span aria-hidden="true">·</span>

                          <span className="font-medium text-emerald-600">
                            Active
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {!editingName && (
              <button
                type="button"
                onClick={handleStartEditingName}
                className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit name
              </button>
            )}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Plan & Usage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current plan, cloud storage, and monthly resource usage.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || usageLoading || storageLoading}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {actionError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="flex min-h-[250px] flex-col rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Crown className="h-5 w-5" strokeWidth={2} />
                </div>

                {planActive && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                )}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Current Plan
              </p>

              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                {planName}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {subscribed
                  ? "Your account has an active subscription with increased usage access."
                  : "You're currently using the free plan."}
              </p>

              <div className="mt-auto pt-5">
                {!subscribed ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {upgradeLoading ? "Opening..." : "Upgrade Plan"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openPuterBilling}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Manage Plan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex min-h-[250px] flex-col rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <HardDrive className="h-5 w-5" strokeWidth={2} />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Storage
              </p>

              {storageLoading ? (
                <p className="mt-2 text-sm text-slate-500">
                  Loading storage...
                </p>
              ) : storageError || !storage ? (
                <p className="mt-2 text-sm text-slate-500">
                  Storage information is currently unavailable.
                </p>
              ) : (
                <>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">
                    {formatBytes(storage.used)} used
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatBytes(storage.capacity)} total
                  </p>

                  <div className="mt-auto pt-5">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.max(
                            storagePercentage > 0 ? 1 : 0,
                            storagePercentage,
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                      <span>
                        {storagePercentage > 0 && storagePercentage < 0.1
                          ? "<0.1% used"
                          : `${storagePercentage.toFixed(1)}% used`}
                      </span>

                      <span>{formatBytes(storageRemaining)} available</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex min-h-[250px] flex-col rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="h-5 w-5" strokeWidth={2} />
                </div>

                {!usageLoading && usage && highResourceUsage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    High usage
                  </span>
                )}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Resources
              </p>

              {usageLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading usage...</p>
              ) : usageError || !usage ? (
                <p className="mt-2 text-sm text-slate-500">
                  Resource information is currently unavailable.
                </p>
              ) : (
                <>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">
                    {formatCredits(usage.used)} credits used
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    of {formatCredits(usage.allowance)} this month
                  </p>

                  <div className="mt-auto pt-5">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          highResourceUsage ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${resourcePercentage}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                      <span>{resourcePercentage.toFixed(0)}% used</span>

                      <span>{formatCredits(usage.remaining)} remaining</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-950">
              Account Provider
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the account connected to Learnadio services.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Cloud className="h-6 w-6" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Puter
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Your connected account provides Learnadio&apos;s AI
                    features, cloud storage, monthly usage allowance, and
                    billing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openPuterAccount}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manage Account
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
