"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/puter";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<Awaited<ReturnType<typeof getCurrentUser>>>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        router.replace("/sign-in");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-4">Signed in as: {user?.username || "User"}</p>

      <button
        onClick={handleSignOut}
        className="mt-6 rounded-lg bg-black px-4 py-2 font-medium text-white"
      >
        Sign Out
      </button>
    </main>
  );
}
