import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { AuthAPI, type UserProfile } from "./api/auth";
import { saveTokens, clearTokens, getTokens } from "./api/client";

interface AuthCtx {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    username: string,
    email: string,
    password: string,
    firstName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  addCredits: (amount: number) => void;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);
const STORAGE_KEY = "finexa_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const { access } = getTokens();
      if (access) {
        try {
          const u = await AuthAPI.me();
          const profile = normalizeUser(u);
          setUser(profile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch {
          clearTokens();
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await AuthAPI.me();
      const profile = normalizeUser(u);
      setUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* silent */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const data = await AuthAPI.login({ email, password });
        saveTokens(data.access, data.refresh);
        const full = await AuthAPI.me();
        const profile = normalizeUser(full);
        setUser(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      } catch (e: any) {
        setIsLoading(false);
        return { success: false, error: e.message || "Login failed" };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      firstName?: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        await AuthAPI.register({
          username,
          email,
          password,
          password_confirm: password,
          first_name: firstName,
        });
        const loginData = await AuthAPI.login({ email, password });
        saveTokens(loginData.access, loginData.refresh);
        const full = await AuthAPI.me();
        const profile = normalizeUser(full);
        setUser(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      } catch (e: any) {
        setIsLoading(false);
        return { success: false, error: e.message || "Signup failed" };
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const addCredits = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ai_credits: (prev.ai_credits ?? 0) + amount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, refreshUser, addCredits }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

function normalizeUser(u: any): UserProfile {
  return {
    ...u,
    ai_credits: u.ai_credits ?? u.credits ?? 100000,
    income: u.income ? +u.income : 0,
    financial_health_score: u.financial_health_score ?? 0,
    onboarding_completed: u.onboarding_completed ?? false,
  };
}
