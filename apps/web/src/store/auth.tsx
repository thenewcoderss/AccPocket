import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "@accpocket/shared";
import { api, sessionTokens } from "../lib/api";
type AuthContextValue = { user: SessionUser | null; ready: boolean; unlocked: boolean; login(email: string, password: string): Promise<void>; signup(input: { name: string; email: string; password: string }): Promise<void>; unlock(passcode: string): Promise<void>; enablePasscode(unlockToken: string): void; lock(): void; logout(): Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null), [ready, setReady] = useState(false), [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const unsubscribe = sessionTokens.onExpired(() => { setUser(null); setUnlocked(false); });
    api.post<{ accessToken: string }>("/auth/refresh").then(async result => { sessionTokens.setAccess(result.accessToken); const me = await api.get<SessionUser>("/me"); setUser(me); setUnlocked(!me.passcodeEnabled); }).catch(() => sessionTokens.clear()).finally(() => setReady(true));
    return unsubscribe;
  }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, ready, unlocked, async login(email, password) { sessionTokens.clear(); const result = await api.post<{ accessToken: string; user: SessionUser }>("/auth/login", { email, password }); sessionTokens.setAccess(result.accessToken); setUser(result.user); setUnlocked(!result.user.passcodeEnabled); }, async signup(input) { sessionTokens.clear(); const result = await api.post<{ accessToken: string; user: SessionUser }>("/auth/signup", { ...input, currency: "BDT", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); sessionTokens.setAccess(result.accessToken); setUser(result.user); setUnlocked(true); }, async unlock(passcode) { const result = await api.post<{ unlockToken: string }>("/passcode/verify", { passcode }); sessionTokens.setUnlock(result.unlockToken); setUnlocked(true); }, enablePasscode(unlockToken) { sessionTokens.setUnlock(unlockToken); setUser(current => current ? { ...current, passcodeEnabled: true } : current); setUnlocked(true); }, lock() { sessionTokens.setUnlock(null); setUnlocked(false); }, async logout() { await api.post("/auth/logout").catch(() => undefined); sessionTokens.clear(); setUser(null); setUnlocked(false); } }), [user, ready, unlocked]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider missing"); return value; };
