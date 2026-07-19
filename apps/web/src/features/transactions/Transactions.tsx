import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import type { AccountDto, TransactionDto } from "@accpocket/shared";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Plus, Tags, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { activeAccounts, canAddEntry, canTransfer } from "../../lib/accountRequirements";
import { useAuth } from "../../store/auth";
import { Empty, ErrorBox, Modal, Money, Page, Spinner } from "../../components/ui";
import { formatTransactionDate, localDateInputValue } from "./date";
import { TRANSACTION_PAGE_SIZE, transactionTotalPages } from "./pagination";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; parentId?: string | null; _count: { children: number } };
type TransactionTitle = { id: string; name: string; canDelete: boolean; transactionCount: number };
type Result = { items: TransactionDto[]; total: number };
type Mode = "INCOME" | "EXPENSE" | "TRANSFER";

export function Transactions() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [manageTitles, setManageTitles] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDto | null>(null);
  const [titleId, setTitleId] = useState(""), [categoryId, setCategoryId] = useState(""), [description, setDescription] = useState(""), [amount, setAmount] = useState(""), [date, setDate] = useState(localDateInputValue());
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const transactions = useQuery({ queryKey: ["transactions", page], queryFn: ({ signal }) => api.get<Result>(`/transactions?page=${page}&limit=${TRANSACTION_PAGE_SIZE}`, { signal }), placeholderData: previous => previous });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: ({ signal }) => api.get<AccountDto[]>("/accounts", { signal }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => api.get<Category[]>("/categories", { signal }) });
  const titles = useQuery({ queryKey: ["transaction-titles"], queryFn: ({ signal }) => api.get<TransactionTitle[]>("/transaction-titles", { signal }) });
  const availableAccounts = activeAccounts(accounts.data);
  const refreshFinancialData = () => { for (const key of ["transactions", "accounts", "dashboard", "budgets", "goals", "report"]) void queryClient.invalidateQueries({ queryKey: [key] }); };
  const add = useMutation({ mutationFn: (body: unknown) => mode === "TRANSFER" ? api.post("/transfers", body) : api.post("/transactions", body), onSuccess: () => { setPage(1); refreshFinancialData(); setTitleId(""); setCategoryId(""); setDescription(""); setAmount(""); setDate(localDateInputValue()); } });
  const remove = useMutation({ mutationFn: (transactionId: string) => api.delete(`/transactions/${transactionId}`), onSuccess: () => { setDeletingTransaction(null); refreshFinancialData(); } });
  const createTitle = useMutation({ mutationFn: (name: string) => api.post<TransactionTitle>("/transaction-titles", { name }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["transaction-titles"] }); } });
  const removeTitle = useMutation({ mutationFn: (id: string) => api.delete(`/transaction-titles/${id}`), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["transaction-titles"] }); } });

  useEffect(() => {
    if (params.get("add") !== "expense" || !accounts.isSuccess) return;
    if (canAddEntry(accounts.data)) { add.reset(); setMode("EXPENSE"); }
    else setAccountNotice("Create a wallet first before adding a transaction.");
    setParams({}, { replace: true });
  }, [accounts.data, accounts.isSuccess, params, setParams]);

  if (transactions.isLoading) return <Spinner/>;

  function openEntry() {
    if (!accounts.isSuccess) return;
    if (!canAddEntry(accounts.data)) { setAccountNotice("Create a wallet first before adding a transaction."); return; }
    setAccountNotice(null); add.reset(); setMode("EXPENSE");
  }

  function openTransfer() {
    if (!accounts.isSuccess) return;
    if (!canTransfer(accounts.data)) { setAccountNotice(availableAccounts.length ? "Create another wallet first before making a transfer." : "Create a wallet first before making a transfer."); return; }
    setAccountNotice(null); setSourceAccountId(""); setDestinationAccountId(""); add.reset(); setMode("TRANSFER");
  }

  function closeModal() { add.reset(); setMode(null); setTitleId(""); setCategoryId(""); setDescription(""); setAmount(""); setDate(localDateInputValue()); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    add.mutate(mode === "TRANSFER"
      ? { sourceAccountId: data.accountId, destinationAccountId: data.destinationAccountId, amount: data.amount, description: data.description, notes: data.notes || undefined, date: data.date }
      : { accountId: data.accountId, titleId: data.titleId, categoryId: data.categoryId || undefined, type: mode, amount: data.amount, description: data.description, notes: data.notes || undefined, date: data.date });
  }

  const totalPages = transactionTotalPages(transactions.data?.total ?? 0);

  return <Page title="Transactions" description="Income, expenses, and transfers in date order." action={<><button className="btn-secondary !px-3" aria-label="Manage Transaction Titles" onClick={() => setManageTitles(true)}><Tags size={18}/><span className="hidden sm:inline">Titles</span></button><button className="btn-secondary !px-3 sm:!px-4" disabled={accounts.isLoading || accounts.isError} aria-label="Create internal transfer" onClick={openTransfer}><ArrowRightLeft size={18}/><span className="hidden min-[420px]:inline">Transfer</span></button><button className="btn-primary !px-3 sm:!px-4" disabled={accounts.isLoading || accounts.isError} onClick={openEntry}><Plus size={18}/>Add</button></>}>
    {accounts.error && <div className="mb-5"><ErrorBox error={accounts.error}/></div>}
    {accountNotice && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pocket-200 bg-pocket-50 p-4 text-sm text-pocket-900"><span>{accountNotice}</span><Link className="btn-tonal" to="/accounts">Go to wallet</Link></div>}
    {transactions.error && <div><ErrorBox error={transactions.error}/><button className="btn-secondary mt-3" onClick={() => void transactions.refetch()}>Try again</button></div>}
    {!transactions.error && <div className="space-y-2">{transactions.data?.items.map(transaction => {
      const isExpense = transaction.type === "EXPENSE", isIncome = transaction.type === "INCOME";
      const Icon = isExpense ? ArrowUpRight : isIncome ? ArrowDownLeft : ArrowRightLeft;
      return <article className="card flex min-w-0 items-center justify-between gap-3" key={transaction.id}><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isExpense ? "bg-red-50 text-red-600" : isIncome ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}><Icon size={20}/></span><div className="min-w-0"><p className="truncate font-semibold">{transaction.title}</p><p className="mt-1 truncate text-xs text-slate-500">{transaction.description ? `${transaction.description} · ` : ""}{formatTransactionDate(transaction.date)} · {isExpense ? "Expense" : isIncome ? "Income" : `Transfer · ${transaction.accountName ?? "Wallet"} → ${transaction.destinationAccountName ?? "Wallet"}`}</p></div></div><div className="flex shrink-0 items-center gap-2"><div className="text-right"><span className={`block text-[10px] font-bold uppercase tracking-wide ${isExpense ? "text-red-500" : isIncome ? "text-green-700" : "text-slate-500"}`}>{isExpense ? "Money out" : isIncome ? "Money in" : "Moved"}</span><Money value={transaction.amount} currency={user?.defaultCurrency} className={`font-bold ${isExpense ? "text-red-600" : isIncome ? "text-green-700" : "text-slate-700"}`}/></div><button className="icon-button text-red-600 hover:bg-red-50" aria-label={`Delete ${transaction.title ?? "transaction"}`} onClick={() => { remove.reset(); setDeletingTransaction(transaction); }}><Trash2 size={18}/></button></div></article>;
    })}</div>}
    {!transactions.error && totalPages > 1 && <nav className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm" aria-label="Transaction pages"><button className="btn-secondary" disabled={page === 1 || transactions.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</button><span className="font-semibold text-slate-600">Page {page} of {totalPages}</span><button className="btn-secondary" disabled={page >= totalPages || transactions.isFetching} onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</button></nav>}
    {!transactions.error && !transactions.data?.items.length && <Empty title="No transactions" text={accounts.isSuccess && !availableAccounts.length ? "Create a wallet first, then record income or expenses." : "Record income, expenses, or internal transfers."} action={accounts.isSuccess && !availableAccounts.length ? <Link className="btn-primary" to="/accounts">Create wallet</Link> : undefined}/>}
    {mode && <Modal title={mode === "TRANSFER" ? "Internal transfer" : `Add ${mode.toLowerCase()}`} close={closeModal}><form className="space-y-5" onSubmit={submit}>
      {mode !== "TRANSFER" && <div className="grid grid-cols-2 gap-2" aria-label="Entry type"><button type="button" className={mode === "INCOME" ? "btn-primary" : "btn-secondary"} onClick={() => { add.reset(); setMode("INCOME"); }}><ArrowDownLeft size={18}/>Income</button><button type="button" className={mode === "EXPENSE" ? "btn-primary" : "btn-secondary"} onClick={() => { add.reset(); setMode("EXPENSE"); }}><ArrowUpRight size={18}/>Expense</button></div>}
      {mode !== "TRANSFER" && <label className="block"><span className="label">Transaction Title</span><select className="input" name="titleId" required value={titleId} onChange={event => setTitleId(event.target.value)} disabled={titles.isLoading}><option value="">{titles.isLoading ? "Loading titles…" : "Choose title"}</option>{titles.data?.map(title => <option key={title.id} value={title.id}>{title.name}</option>)}</select>{titles.isSuccess && !titles.data.length && <span className="mt-1.5 block text-xs text-amber-700">Create a Transaction Title using the Titles button before saving an entry.</span>}</label>}
      <label className="block"><span className="label">{mode === "TRANSFER" ? "From wallet" : "Wallet"}</span><select className="input" name="accountId" required value={mode === "TRANSFER" ? sourceAccountId : undefined} onChange={mode === "TRANSFER" ? event => { setSourceAccountId(event.target.value); if (event.target.value === destinationAccountId) setDestinationAccountId(""); } : undefined}><option value="">Choose wallet</option>{availableAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      {mode === "TRANSFER" && <label className="block"><span className="label">To wallet</span><select className="input" name="destinationAccountId" required value={destinationAccountId} onChange={event => setDestinationAccountId(event.target.value)}><option value="">Choose wallet</option>{availableAccounts.filter(account => account.id !== sourceAccountId).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Transfers only update your AccPocket records between wallets. They do not move real money or count as income or expenses.</span></label>}
      {mode !== "TRANSFER" && <label className="block"><span className="label">Category <span className="font-normal text-slate-400">(optional)</span></span><select className="input" name="categoryId" disabled={categories.isLoading} value={categoryId} onChange={event => setCategoryId(event.target.value)}><option value="">{categories.isLoading ? "Loading categories…" : "Uncategorized"}</option>{categories.data?.filter(category => category.type === mode).map(category => <option key={category.id} value={category.id} disabled={category._count.children > 0}>{category.parentId ? `↳ ${category.name}` : category.name}{category._count.children > 0 ? " (parent only)" : ""}</option>)}</select>{categories.error && <span className="mt-1.5 block text-xs text-amber-700">Categories could not be loaded. You can save this entry as uncategorized.</span>}</label>}
      <label className="block"><span className="label">Amount</span><input className="input-amount" name="amount" type="number" inputMode="decimal" min="0.0001" max="999999999999999.9999" step="0.0001" placeholder="0.00" required value={amount} onChange={event => setAmount(event.target.value)}/><span className="mt-1.5 block text-xs text-slate-500">Enter an amount greater than zero, with up to 4 decimal places.</span></label>
      <label className="block"><span className="label">Date</span><input className="input" name="date" type="date" value={date} onChange={event => setDate(event.target.value)} required/></label>
      <label className="block"><span className="label">Description <span className="font-normal text-slate-400">(optional)</span></span><input className="input" name="description" maxLength={120} value={mode === "TRANSFER" ? description || "Internal transfer" : description} onChange={event => setDescription(event.target.value)}/></label>
      <label className="block"><span className="label">Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea className="input min-h-24 py-3" name="notes" maxLength={500}/></label>
      {add.error && <ErrorBox error={add.error}/>}<button className="btn-primary w-full" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save entry"}</button>
    </form></Modal>}
    {deletingTransaction && <Modal title="Delete transaction?" close={() => setDeletingTransaction(null)}><p className="text-sm leading-6 text-slate-600">This permanently deletes <b>{deletingTransaction.title ?? "this transaction"}</b> and reverses its wallet balance impact. This action cannot be undone.</p>{remove.error && <div className="mt-4"><ErrorBox error={remove.error}/></div>}<div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setDeletingTransaction(null)}>Cancel</button><button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={remove.isPending} onClick={() => remove.mutate(deletingTransaction.id)}>{remove.isPending ? "Deleting…" : "Delete permanently"}</button></div></Modal>}
    {manageTitles && <Modal title="Transaction Titles" close={() => setManageTitles(false)}><form className="flex gap-2" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const name = String(new FormData(form).get("name")); createTitle.mutate(name, { onSuccess: () => form.reset() }); }}><label className="min-w-0 flex-1"><span className="sr-only">New Transaction Title</span><input className="input" name="name" maxLength={80} placeholder="New title" required/></label><button className="btn-primary" disabled={createTitle.isPending}><Plus size={18}/>Add</button></form>{createTitle.error && <div className="mt-3"><ErrorBox error={createTitle.error}/></div>}<div className="mt-5 divide-y divide-slate-100">{titles.data?.map(title => <div className="flex items-center justify-between gap-3 py-3" key={title.id}><div className="min-w-0"><p className="truncate font-semibold">{title.name}</p><p className="text-xs text-slate-500">{title.transactionCount ? `Used by ${title.transactionCount} transaction${title.transactionCount === 1 ? "" : "s"}` : "Not used"}</p></div><button className="icon-button text-red-600 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Delete ${title.name}`} title={title.canDelete ? "Delete Transaction Title" : "Used titles cannot be deleted"} disabled={!title.canDelete || removeTitle.isPending} onClick={() => { if (window.confirm(`Delete Transaction Title “${title.name}”?`)) removeTitle.mutate(title.id); }}><Trash2 size={18}/></button></div>)}</div>{removeTitle.error && <div className="mt-3"><ErrorBox error={removeTitle.error}/></div>}{titles.isSuccess && !titles.data.length && <p className="py-6 text-center text-sm text-slate-500">No Transaction Titles yet.</p>}</Modal>}
  </Page>;
}
