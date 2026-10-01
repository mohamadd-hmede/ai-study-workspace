"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentUser, getDisplayName } from "@/lib/puter";

type User = Awaited<ReturnType<typeof getCurrentUser>>;

type AuthContextType = {
  user: User;
  displayName: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  refreshDisplayName: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const refreshDisplayName = async () => {
    const currentDisplayName = await getDisplayName();
    setDisplayNameState(currentDisplayName);
  };

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        let currentDisplayName: string | null = null;

        if (currentUser) {
          currentDisplayName = await getDisplayName();
        }

        setUser(currentUser);
        setDisplayNameState(currentDisplayName);
      } catch (error) {
        console.error("Failed to load authentication state:", error);
        setUser(null);
        setDisplayNameState(null);
      } finally {
        setLoading(false);
      }
    };

    void loadAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        loading,
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
