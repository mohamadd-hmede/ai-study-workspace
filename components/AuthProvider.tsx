"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser, getDisplayName } from "@/lib/puter";
type User = Awaited<ReturnType<typeof getCurrentUser>> | null;

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

type AuthContextType = {
  user: User;
  displayName: string | null;
  loading: boolean;
  authStatus: AuthStatus;
  refreshUser: () => Promise<void>;
  refreshDisplayName: () => Promise<void>;
};

type AuthState = {
  user: User;
  displayName: string | null;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    displayName: null,
    status: "loading",
  });

  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();

      setAuthState((previous) => ({
        ...previous,
        user: currentUser,
        displayName:
          currentUser?.uuid === previous.user?.uuid
            ? previous.displayName
            : null,
        status: currentUser ? "authenticated" : "unauthenticated",
      }));

      setVerifiedPath(pathname);
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? error.status
          : undefined;

      const message =
        error && typeof error === "object" && "message" in error
          ? error.message
          : undefined;

      setAuthState({
        user: null,
        displayName: null,
        status:
          status === 401 && message === "Unauthorized"
            ? "unauthenticated"
            : "error",
      });

      setVerifiedPath(pathname);

      if (!(status === 401 && message === "Unauthorized")) {
        console.error("Failed to refresh authentication state:", error);
        throw error;
      }
    }
  };

  const refreshDisplayName = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return;
      }

      const currentDisplayName = await getDisplayName();

      setAuthState((previous) => {
        if (previous.user?.uuid !== currentUser.uuid) {
          return previous;
        }

        return {
          ...previous,
          displayName: currentDisplayName,
        };
      });
    } catch (error) {
      console.error("Failed to refresh display name:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (isSignInPage) {
      return;
    }

    let cancelled = false;

    const loadAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (cancelled) return;

        if (!currentUser) {
          setAuthState({
            user: null,
            displayName: null,
            status: "unauthenticated",
          });
          setVerifiedPath(pathname);
          return;
        }

        let currentDisplayName: string | null = null;

        try {
          currentDisplayName = await getDisplayName();
        } catch (error) {
          console.error("Failed to load display name:", error);
        }

        if (cancelled) return;

        setAuthState({
          user: currentUser,
          displayName: currentDisplayName,
          status: "authenticated",
        });

        setVerifiedPath(pathname);
      } catch (error) {
        if (cancelled) return;

        const status =
          error && typeof error === "object" && "status" in error
            ? error.status
            : undefined;

        const message =
          error && typeof error === "object" && "message" in error
            ? error.message
            : undefined;

        setAuthState({
          user: null,
          displayName: null,
          status:
            status === 401 && message === "Unauthorized"
              ? "unauthenticated"
              : "error",
        });

        setVerifiedPath(pathname);

        if (!(status === 401 && message === "Unauthorized")) {
          console.error("Failed to load authentication state:", error);
        }
      }
    };

    void loadAuth();

    return () => {
      cancelled = true;
    };
  }, [isSignInPage, pathname]);

  const isVerified = !isSignInPage && verifiedPath === pathname;

  const authStatus: AuthStatus = isSignInPage
    ? "unauthenticated"
    : isVerified
      ? authState.status
      : "loading";

  const user = authStatus === "authenticated" ? authState.user : null;

  const displayName = user ? authState.displayName : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        loading: authStatus === "loading",
        authStatus,
        refreshUser,
        refreshDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
