"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentUser } from "@/lib/puter";

type User = Awaited<ReturnType<typeof getCurrentUser>>;

type AuthContextType = {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    const loadUser = async () => {
      await refreshUser();
      setLoading(false);
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
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
