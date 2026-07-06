import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Lock, LogOut, PiggyBank, Settings as SettingsIcon } from "lucide-react";
import { Page, ErrorBox } from "../../components/ui";
import { useAuth } from "../../store/auth";
import { api } from "../../lib/api";

export function More() {
  const { user, lock, logout } = useAuth();
  return <Page title="More" description="Planning, preferences, and account security."><div className="space-y-3"><Link className="card-interactive flex items-center gap-4" to="/planning"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pocket-50"><PiggyBank className="text-pocket-700" size={21}/></span><div><b>Budgets & goals</b><p className="mt-0.5 text-sm text-slate-500">Plan spending and savings</p></div></Link><Link className="card-interactive flex items-center gap-4" to="/settings"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pocket-50"><SettingsIcon className="text-pocket-700" size={21}/></span><div><b>Settings</b><p className="mt-0.5 text-sm text-slate-500">Profile, security and preferences</p></div></Link>{user?.passcodeEnabled && <button className="card-interactive flex w-full items-center gap-4 text-left" onClick={lock}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pocket-50"><Lock className="text-pocket-700" size={21}/></span><b>Lock AccPocket</b></button>}<button className="card flex w-full items-center gap-4 text-left text-red-700 transition hover:border-red-200 hover:bg-red-50" onClick={() => void logout()}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50"><LogOut size={21}/></span><b>Sign out</b></button></div></Page>;
}

export function Settings() {
  const { user, enablePasscode } = useAuth();
  const [error, setError] = useState<unknown>(), [saved, setSaved] = useState(false);
  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined);
    const data = new FormData(event.currentTarget), passcode = String(data.get("passcode")), confirm = String(data.get("confirm"));
    if (passcode !== confirm) { setError(new Error("Passcodes do not match")); return; }
    try { const result = await api.post<{ unlockToken: string }>("/passcode/setup", { passcode }); enablePasscode(result.unlockToken); setSaved(true); } catch (caught) { setError(caught); }
  }
  return <Page title="Settings" description="Your profile, preferences, and privacy."><section className="card"><h2 className="section-title">Profile information</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="eyebrow">Name</p><p className="mt-1 font-semibold">{user?.name}</p></div><div><p className="eyebrow">Email</p><p className="mt-1 break-all font-semibold">{user?.email}</p></div><div><p className="eyebrow">Currency</p><p className="mt-1 font-semibold">{user?.defaultCurrency} <span className="status-pill ml-1 bg-slate-100 font-medium normal-case tracking-normal text-slate-500">Fixed for V1</span></p></div><div><p className="eyebrow">Timezone</p><p className="mt-1 font-semibold">{user?.timezone}</p></div></div></section><section className="card mt-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-pocket-50"><Lock className="text-pocket-700" size={20}/></span><div><h2 className="section-title">Passcode protection</h2><p className="text-sm text-slate-500">Keep financial records private on this device.</p></div></div>{user?.passcodeEnabled ? <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Passcode protection is enabled. Use Lock AccPocket from the More screen.</p> : saved ? <div role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Passcode enabled. It will be required the next time AccPocket starts.</div> : <form className="mt-5 space-y-4" onSubmit={setup}><label><span className="label">New 4–6 digit passcode</span><input className="input" type="password" name="passcode" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="new-password" required/></label><label><span className="label">Confirm passcode</span><input className="input" type="password" name="confirm" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="new-password" required/></label>{Boolean(error) && <ErrorBox error={error}/>}<button className="btn-primary w-full sm:w-auto">Enable passcode</button></form>}</section></Page>;
}
