import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountDto, AccountType } from "@accpocket/shared";
import { Plus, WalletCards } from "lucide-react";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: ({ signal }) => api.get<AccountDto[]>("/accounts", { signal }) });
  const availableAccounts = activeAccounts(accounts.data);
  const add = useMutation({
    mutationFn: (body: { name: string; type: AccountType; openingBalance: string }) => api.post<AccountDto>("/accounts", body),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["accounts"] }); void queryClient.invalidateQueries({ queryKey: ["dashboard"] }); void queryClient.invalidateQueries({ queryKey: ["report"] }); setOpen(false); }
  });

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
        <div className="flex items-center justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pocket-50 text-pocket-700"><WalletCards size={21}/></span><span className="status-pill bg-slate-100 text-slate-600">{account.type.replaceAll("_", " ")}</span></div>
        <h2 className="mt-6 truncate font-semibold text-slate-700">{account.name}</h2><p className="mt-1 text-xs text-slate-500">Current balance</p><Money value={account.currentBalance} currency={account.currency} className="mt-0.5 block break-words text-2xl font-bold"/>
      </article>)}
    </div>}
    {!accounts.error && !availableAccounts.length && <Empty title="No wallets" text="Add cash, bank, mobile wallet, savings, or business wallets." action={<button className="btn-primary" onClick={openForm}><Plus size={18}/>Add wallet</button>}/>}
    {open && <Modal title="Add wallet" close={closeForm}><form className="space-y-5" onSubmit={submit}>
      <label className="block"><span className="label">Wallet name</span><input className="input" name="name" required maxLength={60} autoComplete="off"/></label>
      <label className="block"><span className="label">Type</span><select className="input" name="type">{accountTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label className="block"><span className="label">Opening balance</span><input className="input-amount" name="openingBalance" type="number" inputMode="decimal" min="0" max="999999999999999.9999" step="0.0001" defaultValue="0" required/><span className="mt-1.5 block text-xs text-slate-500">Enter the amount currently in this wallet, with up to 4 decimal places. Wallets use {user?.defaultCurrency ?? "your default currency"}.</span></label>
      {add.error && <ErrorBox error={add.error}/>}<button className="btn-primary w-full" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save wallet"}</button>
    </form></Modal>}
  </Page>;
}
