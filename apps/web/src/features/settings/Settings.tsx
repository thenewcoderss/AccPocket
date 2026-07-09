import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Lock, LogOut, PiggyBank, Settings as SettingsIcon } from "lucide-react";
import { Page, ErrorBox } from "../../components/ui";
import { useAuth } from "../../store/auth";
import { api } from "../../lib/api";
import { validatePasscodeSetup } from "./validation";

export function More() {
  const { user, lock, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    await logout();
  }
  return <Page title="More" description="Planning, preferences, and account security.">
    <div className="space-y-3">
      <Link className="card-interactive flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pocket-300" to="/planning"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pocket-50"><PiggyBank className="text-pocket-700" size={21}/></span><div><b>Budgets & goals</b><p className="mt-0.5 text-sm text-slate-500">Plan spending and savings</p></div></Link>
      <Link className="card-interactive flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pocket-300" to="/settings"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pocket-50"><SettingsIcon className="text-pocket-700" size={21}/></span><div><b>Settings</b><p className="mt-0.5 text-sm text-slate-500">Profile, security and preferences</p></div></Link>
      {user?.passcodeEnabled && <button className="card-interactive flex w-full items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pocket-300" onClick={lock} aria-label="Lock AccPocket now"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pocket-50"><Lock className="text-pocket-700" size={21}/></span><div><b>Lock AccPocket</b><p className="mt-0.5 text-sm text-slate-500">Require your passcode before viewing protected screens.</p></div></button>}
      <button className="card flex w-full items-center gap-4 text-left text-red-700 transition hover:border-red-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-wait disabled:opacity-70" onClick={() => void signOut()} disabled={signingOut} aria-label="Sign out of AccPocket"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50"><LogOut size={21}/></span><b>{signingOut ? "Signing out..." : "Sign out"}</b></button>
    </div>
  </Page>;
}

export function Settings() {
  const { user, enablePasscode } = useAuth();
  const [error, setError] = useState<unknown>(), [saved, setSaved] = useState(false), [saving, setSaving] = useState(false);
  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); setSaved(false);
    const data = new FormData(event.currentTarget), passcode = String(data.get("passcode")), confirm = String(data.get("confirm"));
    try {
      validatePasscodeSetup(passcode, confirm);
      setSaving(true);
      const result = await api.post<{ unlockToken: string }>("/passcode/setup", { passcode });
      enablePasscode(result.unlockToken);
      setSaved(true);
      event.currentTarget.reset();
    } catch (caught) { setError(caught); }
    finally { setSaving(false); }
  }
  if (!user) return <Page title="Settings" description="Your profile, preferences, and app-access protection."><section className="card" role="status">Loading settings...</section></Page>;
  return <Page title="Settings" description="Your profile, preferences, and app-access protection.">
    <section className="card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="section-title">Profile information</h2><p className="mt-1 text-sm text-slate-500">Your account identity for this AccPocket workspace.</p></div>
        <span className="status-pill w-fit bg-slate-100 text-slate-600">V1 read-only</span>
      </div>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div><dt className="eyebrow">Name</dt><dd className="mt-1 break-words font-semibold">{user.name}</dd></div>
        <div><dt className="eyebrow">Email</dt><dd className="mt-1 break-all font-semibold">{user.email}</dd></div>
        <div><dt className="eyebrow">Default currency</dt><dd className="mt-1 font-semibold">{user.defaultCurrency} <span className="status-pill ml-1 bg-slate-100 font-medium normal-case tracking-normal text-slate-500">Fixed for V1</span></dd><p className="mt-1 text-xs text-slate-500">New records use this display currency; no automatic currency conversion is included.</p></div>
        <div><dt className="eyebrow">Timezone</dt><dd className="mt-1 break-words font-semibold">{user.timezone}</dd></div>
      </dl>
    </section>

    <section className="card mt-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pocket-50"><Lock className="text-pocket-700" size={20}/></span>
        <div><h2 className="section-title">Passcode protection</h2><p className="text-sm text-slate-500">Passcode protects app access on this device. It does not encrypt database contents.</p></div>
      </div>
      {user.passcodeEnabled ? <div role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Passcode protection is enabled. Use Lock AccPocket from the More screen to require your passcode again.</div> : saved ? <div role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Passcode enabled. It will be required the next time AccPocket starts or when you lock the app.</div> : <form className="mt-5 space-y-4" onSubmit={setup}>
        <label className="block"><span className="label">New 4-6 digit passcode</span><input className="input" type="password" name="passcode" inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} autoComplete="new-password" aria-describedby="passcode-help" required/></label>
        <label className="block"><span className="label">Confirm passcode</span><input className="input" type="password" name="confirm" inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} autoComplete="new-password" required/></label>
        <p id="passcode-help" className="text-xs text-slate-500">Use 4 to 6 digits. Avoid birthdays or obvious repeated numbers.</p>
        {Boolean(error) && <ErrorBox error={error}/>}
        <button className="btn-primary w-full sm:w-auto" disabled={saving}>{saving ? "Enabling..." : "Enable passcode"}</button>
      </form>}
    </section>

    <section className="card mt-4">
      <h2 className="section-title">Account and security notes</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
        <li>Settings are scoped to your signed-in account.</li>
        <li>Logout ends this browser session. Other sessions are not changed from this screen.</li>
        <li>Profile editing, passcode changes, and currency changes are intentionally limited in V1.</li>
      </ul>
    </section>
  </Page>;
}
