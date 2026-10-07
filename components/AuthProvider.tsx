"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
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

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setAuthStatus(currentUser ? "authenticated" : "unauthenticated");
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? error.status
          : undefined;

      const message =
        error && typeof error === "object" && "message" in error
          ? error.message
          : undefined;

      if (status === 401 && message === "Unauthorized") {
        setUser(null);
        setAuthStatus("unauthenticated");
        return;
      }

      console.error("Failed to refresh authentication state:", error);
      setAuthStatus("error");
      throw error;
    }
  };

  const refreshDisplayName = async () => {
    try {
      const currentDisplayName = await getDisplayName();
      setDisplayNameState(currentDisplayName);
    } catch (error) {
      console.error("Failed to refresh display name:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);

        if (!currentUser) {
          setAuthStatus("unauthenticated");
          return;
        }

        setAuthStatus("authenticated");

        try {
          const currentDisplayName = await getDisplayName();
          setDisplayNameState(currentDisplayName);
        } catch (error) {
          console.error("Failed to load display name:", error);
          setDisplayNameState(null);
        }
      } catch (error) {
        const status =
          error && typeof error === "object" && "status" in error
            ? error.status
            : undefined;

        const message =
          error && typeof error === "object" && "message" in error
            ? error.message
            : undefined;

        if (status === 401 && message === "Unauthorized") {
          setUser(null);
          setAuthStatus("unauthenticated");
          return;
        }

        console.error("Failed to load authentication state:", error);
        setAuthStatus("error");
      }
    };

    void loadAuth();
  }, []);

  const loading = authStatus === "loading";

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        loading,
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
