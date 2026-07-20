import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountDto, AccountType } from "@accpocket/shared";
import { Archive, Plus, RotateCcw, Trash2, WalletCards } from "lucide-react";
import { api } from "../../lib/api";
import { activeAccounts } from "../../lib/accountRequirements";
import { useAuth } from "../../store/auth";
import { Empty, ErrorBox, Modal, Money, Page, Spinner } from "../../components/ui";

const accountTypes: Array<{ value: AccountType; label: string }> = [
  { value: "CASH", label: "Cash" }, { value: "BANK", label: "Bank" },
  { value: "MOBILE_WALLET", label: "Mobile wallet" }, { value: "SAVINGS", label: "Savings" },
  { value: "BUSINESS", label: "Business" }, { value: "OTHER", label: "Other" }
];

export function Accounts() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<AccountDto | null>(null);
  const [archiving, setArchiving] = useState<AccountDto | null>(null);
  const [restoring, setRestoring] = useState<AccountDto | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts", "manage"], queryFn: ({ signal }) => api.get<AccountDto[]>("/accounts?includeArchived=true", { signal }) });
  const availableAccounts = activeAccounts(accounts.data);
  const archivedAccounts = accounts.data?.filter(account => account.isArchived) ?? [];
  const refreshAccountData = () => { for (const key of ["accounts", "transactions", "dashboard", "report", "budgets", "goals"]) void queryClient.invalidateQueries({ queryKey: [key] }); };
  const add = useMutation({
    mutationFn: (body: { name: string; type: AccountType; openingBalance: string }) => api.post<AccountDto>("/accounts", body),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["accounts"] }); void queryClient.invalidateQueries({ queryKey: ["dashboard"] }); void queryClient.invalidateQueries({ queryKey: ["report"] }); setOpen(false); }
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/accounts/${id}`), onSuccess: () => { setDeleting(null); refreshAccountData(); } });
  const archive = useMutation({ mutationFn: (id: string) => api.patch(`/accounts/${id}/archive`, {}), onSuccess: () => { setArchiving(null); refreshAccountData(); } });
  const restore = useMutation({ mutationFn: (id: string) => api.patch(`/accounts/${id}/restore`, {}), onSuccess: () => { setRestoring(null); refreshAccountData(); } });

  function openForm() { add.reset(); setOpen(true); }
  function closeForm() { add.reset(); setOpen(false); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    add.mutate({ name: String(data.get("name")).trim(), type: String(data.get("type")) as AccountType, openingBalance: String(data.get("openingBalance")) });
  }

  if (accounts.isLoading) return <Spinner/>;
  return <Page title="Wallet" description="Everything you track, in one place." action={<button className="btn-primary" onClick={openForm}><Plus size={18}/>Add wallet</button>}>
    {accounts.error && <div><ErrorBox error={accounts.error}/><button className="btn-secondary mt-3" onClick={() => void accounts.refetch()}>Try again</button></div>}
    {!accounts.error && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {availableAccounts.map(account => <article className="card-interactive min-w-0" key={account.id}>
        <div className="flex items-center justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pocket-50 text-pocket-700"><WalletCards size={21}/></span><div className="flex items-center gap-2"><span className="status-pill bg-slate-100 text-slate-600">{account.type.replaceAll("_", " ")}</span><button className="icon-button text-amber-700 disabled:cursor-not-allowed disabled:opacity-35" disabled={!account.canArchive} title={account.canArchive ? "Archive wallet" : account.archiveBlockedReason} aria-label={account.canArchive ? `Archive ${account.name}` : `${account.name} cannot be archived: ${account.archiveBlockedReason}`} onClick={() => { archive.reset(); setArchiving(account); }}><Archive size={18}/></button><button className="icon-button text-red-600 disabled:cursor-not-allowed disabled:opacity-35" disabled={!account.canDelete} title={account.canDelete ? "Delete wallet" : account.deleteBlockedReason} aria-label={account.canDelete ? `Delete ${account.name}` : `${account.name} cannot be deleted: ${account.deleteBlockedReason}`} onClick={() => { remove.reset(); setDeleting(account); }}><Trash2 size={18}/></button></div></div>
        <h2 className="mt-6 truncate font-semibold text-slate-700">{account.name}</h2><p className="mt-1 text-xs text-slate-500">Current balance</p><Money value={account.currentBalance} currency={account.currency} className="mt-0.5 block break-words text-2xl font-bold"/>
      </article>)}
    </div>}
    {!accounts.error && !availableAccounts.length && <Empty title="No wallets" text="Add cash, bank, mobile wallet, savings, or business wallets." action={<button className="btn-primary" onClick={openForm}><Plus size={18}/>Add wallet</button>}/>}
    {!accounts.error && archivedAccounts.length > 0 && <section className="mt-8"><h2 className="section-title">Archived wallets</h2><p className="mb-3 mt-1 text-sm text-slate-500">Preserved for transaction history and reports. Restore a wallet to use it again.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{archivedAccounts.map(account => <article className="card min-w-0 border-dashed bg-slate-50 opacity-90" key={account.id}><div className="flex items-center justify-between gap-3"><span className="status-pill bg-slate-200 text-slate-700">Archived</span><div className="flex gap-2"><button className="icon-button text-pocket-700" title="Restore wallet" aria-label={`Restore ${account.name}`} onClick={() => { restore.reset(); setRestoring(account); }}><RotateCcw size={18}/></button><button className="icon-button text-red-600 disabled:cursor-not-allowed disabled:opacity-35" disabled={!account.canDelete} title={account.canDelete ? "Delete wallet" : account.deleteBlockedReason} aria-label={account.canDelete ? `Delete ${account.name}` : `${account.name} cannot be deleted: ${account.deleteBlockedReason}`} onClick={() => { remove.reset(); setDeleting(account); }}><Trash2 size={18}/></button></div></div><h3 className="mt-5 truncate font-semibold text-slate-700">{account.name}</h3><p className="mt-1 text-xs text-slate-500">{account.type.replaceAll("_", " ")} · Current balance</p><Money value={account.currentBalance} currency={account.currency} className="mt-0.5 block break-words text-2xl font-bold"/></article>)}</div></section>}
    {open && <Modal title="Add wallet" close={closeForm}><form className="space-y-5" onSubmit={submit}>
      <label className="block"><span className="label">Wallet name</span><input className="input" name="name" required maxLength={60} autoComplete="off"/></label>
      <label className="block"><span className="label">Type</span><select className="input" name="type">{accountTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label className="block"><span className="label">Opening balance</span><input className="input-amount" name="openingBalance" type="number" inputMode="decimal" min="0" max="999999999999999.9999" step="0.0001" defaultValue="0" required/><span className="mt-1.5 block text-xs text-slate-500">Enter the amount currently in this wallet, with up to 4 decimal places. Wallets use {user?.defaultCurrency ?? "your default currency"}.</span></label>
      {add.error && <ErrorBox error={add.error}/>}<button className="btn-primary w-full" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save wallet"}</button>
    </form></Modal>}
    {deleting && <Modal title="Delete wallet?" close={() => setDeleting(null)}><p className="text-sm leading-6 text-slate-600">Delete <b>{deleting.name}</b>? This is only allowed because it has no transaction history or savings goals.</p>{remove.error && <div className="mt-4"><ErrorBox error={remove.error}/></div>}<div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>{remove.isPending ? "Deleting…" : "Delete wallet"}</button></div></Modal>}
    {archiving && <Modal title={`Archive ${archiving.name}?`} close={() => setArchiving(null)}><p className="text-sm leading-6 text-slate-600">Existing transactions and reports will remain unchanged. This wallet will no longer be available for new transactions or transfers, but it can be restored later.</p>{archive.error && <div className="mt-4"><ErrorBox error={archive.error}/></div>}<div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setArchiving(null)}>Cancel</button><button className="btn-primary" disabled={archive.isPending} onClick={() => archive.mutate(archiving.id)}>{archive.isPending ? "Archiving…" : "Archive wallet"}</button></div></Modal>}
    {restoring && <Modal title={`Restore ${restoring.name}?`} close={() => setRestoring(null)}><p className="text-sm leading-6 text-slate-600">This wallet will become available for new transactions and transfers again.</p>{restore.error && <div className="mt-4"><ErrorBox error={restore.error}/></div>}<div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setRestoring(null)}>Cancel</button><button className="btn-primary" disabled={restore.isPending} onClick={() => restore.mutate(restoring.id)}>{restore.isPending ? "Restoring…" : "Restore wallet"}</button></div></Modal>}
  </Page>;
}
