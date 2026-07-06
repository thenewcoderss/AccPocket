import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../../store/auth";
import { ErrorBox, Spinner } from "../../components/ui";

export function AuthPage({ signup = false }: { signup?: boolean }) {
  const auth = useAuth(), navigate = useNavigate();
  const [error, setError] = useState<unknown>(), [busy, setBusy] = useState(false);
  if (auth.user) return <Navigate to="/"/>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined);
    const data = new FormData(event.currentTarget);
    try { if (signup) await auth.signup({ name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")) }); else await auth.login(String(data.get("email")), String(data.get("password"))); navigate("/"); }
    catch (caught) { setError(caught); } finally { setBusy(false); }
  }
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-pocket-50 via-slate-50 to-slate-100 p-4"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pocket-200/30 blur-3xl"/><div className="relative w-full max-w-md rounded-[28px] border border-white bg-white p-7 shadow-card sm:p-8"><div className="mb-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-pocket-700 text-xl font-bold text-white shadow-button">A</span><h1 className="mt-6 text-3xl font-bold tracking-tight">{signup ? "Create your pocket" : "Welcome back"}</h1><p className="mt-2 leading-6 text-slate-500">Simple, private control of your money.</p></div><form className="space-y-4" onSubmit={submit}>{signup && <label><span className="label">Name</span><input className="input" name="name" required minLength={2} autoComplete="name"/></label>}<label><span className="label">Email</span><input className="input" name="email" type="email" required autoComplete="email"/></label><label><span className="label">Password</span><input className="input" name="password" type="password" minLength={10} required autoComplete={signup ? "new-password" : "current-password"}/>{signup && <span className="mt-1.5 block text-xs text-slate-500">Use at least 10 characters.</span>}</label>{Boolean(error) && <ErrorBox error={error}/>}<button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button></form><button className="mt-6 min-h-11 w-full rounded-xl text-sm font-semibold text-pocket-700 hover:bg-pocket-50" onClick={() => navigate(signup ? "/login" : "/signup")}>{signup ? "Already registered? Sign in" : "New to AccPocket? Create account"}</button></div></main>;
}

export function UnlockPage() {
  const auth = useAuth();
  const [passcode, setPasscode] = useState(""), [error, setError] = useState<unknown>();
  if (!auth.ready) return <Spinner/>;
  if (!auth.user) return <Navigate to="/login" replace/>;
  if (auth.unlocked) return <Navigate to="/" replace/>;
  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pocket-800 to-pocket-900 p-4"><div className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-2xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pocket-50 text-pocket-700"><LockKeyhole size={26}/></div><h1 className="mt-5 text-2xl font-bold tracking-tight">AccPocket is locked</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your passcode to view your financial records.</p><form className="mt-6 space-y-4" onSubmit={async event => { event.preventDefault(); setError(undefined); try { await auth.unlock(passcode); } catch (caught) { setError(caught); } }}><input className="input text-center text-2xl tracking-[.4em]" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} value={passcode} onChange={event => setPasscode(event.target.value.replace(/\D/g, ""))} autoFocus autoComplete="current-password" aria-label="Passcode"/>{Boolean(error) && <ErrorBox error={error}/>}<button className="btn-primary w-full">Unlock</button></form><button className="mt-4 min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100" onClick={() => void auth.logout()}>Sign out</button></div></main>;
}
