"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { isOwner as checkIsOwner } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Vlasnik servisa (owners/{uid} u Firestore) — jedini kreira evente
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isOwner: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        setIsOwner(await checkIsOwner(u.uid).catch(() => false));
      } else {
        setIsOwner(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading, isOwner }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
