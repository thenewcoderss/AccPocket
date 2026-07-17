import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import type { AccountDto, TransactionDto } from "@accpocket/shared";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { activeAccounts, canAddEntry, canTransfer } from "../../lib/accountRequirements";
import { useAuth } from "../../store/auth";
import { Empty, ErrorBox, Modal, Money, Page, Spinner } from "../../components/ui";
import { formatTransactionDate, localDateInputValue } from "./date";
import { TRANSACTION_PAGE_SIZE, transactionTotalPages } from "./pagination";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };
type Result = { items: TransactionDto[]; total: number };
type Mode = "INCOME" | "EXPENSE" | "TRANSFER";

export function Transactions() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const transactions = useQuery({ queryKey: ["transactions", page], queryFn: ({ signal }) => api.get<Result>(`/transactions?page=${page}&limit=${TRANSACTION_PAGE_SIZE}`, { signal }), placeholderData: previous => previous });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: ({ signal }) => api.get<AccountDto[]>("/accounts", { signal }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => api.get<Category[]>("/categories", { signal }) });
  const availableAccounts = activeAccounts(accounts.data);
  const add = useMutation({ mutationFn: (body: unknown) => mode === "TRANSFER" ? api.post("/transfers", body) : api.post("/transactions", body), onSuccess: () => { setPage(1); void queryClient.invalidateQueries({ queryKey: ["transactions"] }); void queryClient.invalidateQueries({ queryKey: ["accounts"] }); void queryClient.invalidateQueries({ queryKey: ["dashboard"] }); void queryClient.invalidateQueries({ queryKey: ["budgets"] }); void queryClient.invalidateQueries({ queryKey: ["goals"] }); void queryClient.invalidateQueries({ queryKey: ["report"] }); setMode(null); } });

  useEffect(() => {
    if (params.get("add") !== "expense" || !accounts.isSuccess) return;
    if (canAddEntry(accounts.data)) { add.reset(); setMode("EXPENSE"); }
    else setAccountNotice("Create an account first before adding a transaction.");
    setParams({}, { replace: true });
  }, [accounts.data, accounts.isSuccess, params, setParams]);

  if (transactions.isLoading) return <Spinner/>;

  function openEntry() {
    if (!accounts.isSuccess) return;
    if (!canAddEntry(accounts.data)) { setAccountNotice("Create an account first before adding a transaction."); return; }
    setAccountNotice(null); add.reset(); setMode("EXPENSE");
  }

  function openTransfer() {
    if (!accounts.isSuccess) return;
    if (!canTransfer(accounts.data)) { setAccountNotice(availableAccounts.length ? "Create another account first before making a transfer." : "Create an account first before making a transfer."); return; }
    setAccountNotice(null); setSourceAccountId(""); setDestinationAccountId(""); add.reset(); setMode("TRANSFER");
  }

  function closeModal() { add.reset(); setMode(null); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    add.mutate(mode === "TRANSFER"
      ? { sourceAccountId: data.accountId, destinationAccountId: data.destinationAccountId, amount: data.amount, description: data.description, notes: data.notes || undefined, date: data.date }
      : { accountId: data.accountId, categoryId: data.categoryId || undefined, type: mode, amount: data.amount, description: data.description, notes: data.notes || undefined, date: data.date });
  }

  const totalPages = transactionTotalPages(transactions.data?.total ?? 0);

  return <Page title="Transactions" description="Income, expenses, and transfers in date order." action={<><button className="btn-secondary !px-3 sm:!px-4" disabled={accounts.isLoading || accounts.isError} aria-label="Create internal transfer" onClick={openTransfer}><ArrowRightLeft size={18}/><span className="hidden min-[420px]:inline">Transfer</span></button><button className="btn-primary !px-3 sm:!px-4" disabled={accounts.isLoading || accounts.isError} onClick={openEntry}><Plus size={18}/>Add</button></>}>
    {accounts.error && <div className="mb-5"><ErrorBox error={accounts.error}/></div>}
    {accountNotice && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pocket-200 bg-pocket-50 p-4 text-sm text-pocket-900"><span>{accountNotice}</span><Link className="btn-tonal" to="/accounts">Go to accounts</Link></div>}
    {transactions.error && <div><ErrorBox error={transactions.error}/><button className="btn-secondary mt-3" onClick={() => void transactions.refetch()}>Try again</button></div>}
    {!transactions.error && <div className="space-y-2">{transactions.data?.items.map(transaction => {
      const isExpense = transaction.type === "EXPENSE", isIncome = transaction.type === "INCOME";
      const Icon = isExpense ? ArrowUpRight : isIncome ? ArrowDownLeft : ArrowRightLeft;
      return <article className="card flex min-w-0 items-center justify-between gap-3" key={transaction.id}><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isExpense ? "bg-red-50 text-red-600" : isIncome ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}><Icon size={20}/></span><div className="min-w-0"><p className="truncate font-semibold">{transaction.description}</p><p className="mt-1 truncate text-xs text-slate-500">{formatTransactionDate(transaction.date)} · {isExpense ? "Expense" : isIncome ? "Income" : `Transfer · ${transaction.accountName ?? "Account"} → ${transaction.destinationAccountName ?? "Account"}`}</p></div></div><div className="shrink-0 text-right"><span className={`block text-[10px] font-bold uppercase tracking-wide ${isExpense ? "text-red-500" : isIncome ? "text-green-700" : "text-slate-500"}`}>{isExpense ? "Money out" : isIncome ? "Money in" : "Moved"}</span><Money value={transaction.amount} currency={user?.defaultCurrency} className={`font-bold ${isExpense ? "text-red-600" : isIncome ? "text-green-700" : "text-slate-700"}`}/></div></article>;
    })}</div>}
    {!transactions.error && totalPages > 1 && <nav className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm" aria-label="Transaction pages"><button className="btn-secondary" disabled={page === 1 || transactions.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</button><span className="font-semibold text-slate-600">Page {page} of {totalPages}</span><button className="btn-secondary" disabled={page >= totalPages || transactions.isFetching} onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</button></nav>}
    {!transactions.error && !transactions.data?.items.length && <Empty title="No transactions" text={accounts.isSuccess && !availableAccounts.length ? "Create an account first, then record income or expenses." : "Record income, expenses, or internal transfers."} action={accounts.isSuccess && !availableAccounts.length ? <Link className="btn-primary" to="/accounts">Create account</Link> : undefined}/>} 
    {mode && <Modal title={mode === "TRANSFER" ? "Internal transfer" : `Add ${mode.toLowerCase()}`} close={closeModal}><form className="space-y-5" onSubmit={submit}>
      {mode !== "TRANSFER" && <div className="grid grid-cols-2 gap-2" aria-label="Entry type"><button type="button" className={mode === "INCOME" ? "btn-primary" : "btn-secondary"} onClick={() => { add.reset(); setMode("INCOME"); }}><ArrowDownLeft size={18}/>Income</button><button type="button" className={mode === "EXPENSE" ? "btn-primary" : "btn-secondary"} onClick={() => { add.reset(); setMode("EXPENSE"); }}><ArrowUpRight size={18}/>Expense</button></div>}
      <label className="block"><span className="label">{mode === "TRANSFER" ? "From account" : "Account"}</span><select className="input" name="accountId" required value={mode === "TRANSFER" ? sourceAccountId : undefined} onChange={mode === "TRANSFER" ? event => { setSourceAccountId(event.target.value); if (event.target.value === destinationAccountId) setDestinationAccountId(""); } : undefined}><option value="">Choose account</option>{availableAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      {mode === "TRANSFER" && <label className="block"><span className="label">To account</span><select className="input" name="destinationAccountId" required value={destinationAccountId} onChange={event => setDestinationAccountId(event.target.value)}><option value="">Choose account</option>{availableAccounts.filter(account => account.id !== sourceAccountId).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Transfers only update your AccPocket records between accounts. They do not move real money or count as income or expenses.</span></label>}
      {mode !== "TRANSFER" && <label className="block"><span className="label">Category <span className="font-normal text-slate-400">(optional)</span></span><select className="input" name="categoryId" disabled={categories.isLoading}><option value="">{categories.isLoading ? "Loading categories…" : "Uncategorized"}</option>{categories.data?.filter(category => category.type === mode).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{categories.error && <span className="mt-1.5 block text-xs text-amber-700">Categories could not be loaded. You can save this entry as uncategorized.</span>}</label>}
      <label className="block"><span className="label">Amount</span><input className="input-amount" name="amount" type="number" inputMode="decimal" min="0.0001" max="999999999999999.9999" step="0.0001" placeholder="0.00" required/><span className="mt-1.5 block text-xs text-slate-500">Enter an amount greater than zero, with up to 4 decimal places.</span></label>
      <label className="block"><span className="label">Date</span><input className="input" name="date" type="date" defaultValue={localDateInputValue()} required/></label>
      <label className="block"><span className="label">Description</span><input className="input" name="description" maxLength={120} pattern=".*\S.*" title="Enter a description" defaultValue={mode === "TRANSFER" ? "Internal transfer" : ""} required/></label>
      <label className="block"><span className="label">Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea className="input min-h-24 py-3" name="notes" maxLength={500}/></label>
      {add.error && <ErrorBox error={add.error}/>}<button className="btn-primary w-full" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save entry"}</button>
    </form></Modal>}
  </Page>;
}
