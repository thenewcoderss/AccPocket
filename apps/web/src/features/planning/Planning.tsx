import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountDto } from "@accpocket/shared";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { activeAccounts, contributionAccounts } from "../../lib/accountRequirements";
import { Empty, ErrorBox, Modal, Money, Page, Spinner } from "../../components/ui";
import { localBudgetMonth } from "./budgetDate";
import { localDateInputValue } from "../transactions/date";

type Budget = { id: string; categoryId: string; name: string; color: string; month: string; limit: string; spent: string; remaining: string; overBy: string; percentage: string };
type Goal = { id: string; name: string; type: "SAVINGS" | "EMERGENCY_FUND"; targetAmount: string; saved: string; remaining: string; overBy: string; percentage: string; status: "ACTIVE" | "COMPLETED" | "ARCHIVED"; destinationAccountId: string; destinationAccountName: string };
type Category = { id: string; name: string; type: string };
type Dialog = { type: "budget" } | { type: "goal" } | { type: "contribute"; goal: Goal };

export function Planning() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [budgetNotice, setBudgetNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const month = localBudgetMonth();
  const budgets = useQuery({ queryKey: ["budgets", month], queryFn: ({ signal }) => api.get<Budget[]>(`/budgets?month=${month}`, { signal }) });
  const goals = useQuery({ queryKey: ["goals"], queryFn: ({ signal }) => api.get<Goal[]>("/goals", { signal }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => api.get<Category[]>("/categories", { signal }) });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: ({ signal }) => api.get<AccountDto[]>("/accounts", { signal }) });
  const availableAccounts = activeAccounts(accounts.data);
  const availableBudgetCategories = categories.data?.filter(category => category.type === "EXPENSE" && !budgets.data?.some(budget => budget.categoryId === category.id)) ?? [];
  const save = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) => api.post(path, body),
    onSuccess: (_data, variables) => {
      if (variables.path === "/budgets") void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      else { void queryClient.invalidateQueries({ queryKey: ["goals"] }); void queryClient.invalidateQueries({ queryKey: ["accounts"] }); void queryClient.invalidateQueries({ queryKey: ["transactions"] }); }
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["report"] });
      setDialog(null);
    }
  });

  function openBudget() {
    if (!categories.isSuccess || !budgets.isSuccess) return;
    if (!availableBudgetCategories.length) { setBudgetNotice("Every expense category already has a budget for this month."); return; }
    setBudgetNotice(null); save.reset(); setDialog({ type: "budget" });
  }

  function closeDialog() { save.reset(); setDialog(null); }

  function openGoal() {
    if (!accounts.isSuccess) return;
    if (!availableAccounts.length) { setAccountNotice("Create an account first before adding a savings or emergency fund goal."); return; }
    setAccountNotice(null); save.reset();
    setDialog({ type: "goal" });
  }

  function openContribution(goal: Goal) {
    if (!accounts.isSuccess) return;
    if (!contributionAccounts(accounts.data, goal.destinationAccountId).length) { setAccountNotice("Create another account first before adding a contribution."); return; }
    setAccountNotice(null); save.reset();
    setDialog({ type: "contribute", goal });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (dialog.type === "budget") save.mutate({ path: "/budgets", body: { categoryId: data.categoryId, month, limitAmount: data.amount } });
    if (dialog.type === "goal") save.mutate({ path: "/goals", body: { destinationAccountId: data.accountId, type: data.type, name: data.name, targetAmount: data.amount, targetDate: data.targetDate || undefined } });
    if (dialog.type === "contribute") save.mutate({ path: `/goals/${dialog.goal.id}/contributions`, body: { sourceAccountId: data.accountId, amount: data.amount, date: data.date, description: data.description, notes: data.notes || undefined } });
  }

  const accountAction = <Link className="btn-tonal" to="/accounts">Go to accounts</Link>;
  return <Page title="Plans" description="Set simple limits and make steady progress." action={<div className="flex gap-2"><button className="btn-secondary" disabled={categories.isLoading || categories.isError || budgets.isLoading || budgets.isError} onClick={openBudget}>Budget</button><button className="btn-primary" disabled={accounts.isLoading || accounts.isError} onClick={openGoal}><Plus size={18}/>Goal</button></div>}>
    {accounts.error && <div className="mb-5"><ErrorBox error={accounts.error}/></div>}
    {accountNotice && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pocket-200 bg-pocket-50 p-4 text-sm text-pocket-900"><span>{accountNotice}</span>{accountAction}</div>}
    {budgetNotice && <div role="status" className="mb-5 rounded-xl border border-pocket-200 bg-pocket-50 p-4 text-sm text-pocket-900">{budgetNotice}</div>}
    <h2 className="section-title">Monthly budgets</h2><p className="mb-3 mt-1 text-sm text-slate-500">Keep category spending within a comfortable range for {month}.</p>
    {budgets.isLoading && <Spinner/>}
    {budgets.error && <div><ErrorBox error={budgets.error}/><button className="btn-secondary mt-3" onClick={() => void budgets.refetch()}>Try again</button></div>}
    {categories.error && <div className="mt-3"><ErrorBox error={categories.error}/><button className="btn-secondary mt-3" onClick={() => void categories.refetch()}>Retry categories</button></div>}
    {!budgets.isLoading && !budgets.error && <div className="grid gap-3 sm:grid-cols-2">{budgets.data?.map(budget => { const percentage = Number(budget.percentage); const overBudget = percentage > 100; return <div className={`card ${overBudget ? "border-red-200" : ""}`} key={budget.id}><div className="flex justify-between gap-3"><b>{budget.name}</b><span className={`text-sm font-semibold ${overBudget ? "text-red-600" : "text-slate-600"}`}>{budget.percentage}%</span></div><p className="mt-2 text-sm"><Money value={budget.spent}/> spent of <Money value={budget.limit}/></p><p className={`mt-1 text-xs ${overBudget ? "font-semibold text-red-600" : "text-slate-500"}`}>{overBudget ? <>Over by <Money value={budget.overBy}/></> : <><Money value={budget.remaining}/> remaining</>}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ background: overBudget ? "#dc2626" : budget.color, width: `${Math.max(0, Math.min(100, percentage))}%` }}/></div></div>; })}</div>}
    {!budgets.isLoading && !budgets.error && !budgets.data?.length && <Empty title="No budget this month" text="Set limits for your expense categories."/>}

    <h2 className="section-title mt-8">Savings & emergency funds</h2><p className="mb-3 mt-1 text-sm text-slate-500">Build toward goals one contribution at a time.</p>
    {goals.isLoading && <Spinner/>}
    {goals.error && <div><ErrorBox error={goals.error}/><button className="btn-secondary mt-3" onClick={() => void goals.refetch()}>Try again</button></div>}
    {!goals.isLoading && !goals.error && <div className="grid gap-3 sm:grid-cols-2">{goals.data?.map(goal => { const percentage = Number(goal.percentage); const overTarget = percentage > 100; return <div className={`card ${overTarget ? "border-pocket-200" : ""}`} key={goal.id}><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-semibold text-pocket-700">{goal.type === "EMERGENCY_FUND" ? "EMERGENCY FUND" : "SAVINGS"}</span><h3 className="mt-1 font-bold">{goal.name}</h3></div><span className="text-sm font-semibold text-slate-600">{goal.percentage}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-pocket-600" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}/></div><p className="mt-2 text-xs text-slate-500"><Money value={goal.saved}/> of <Money value={goal.targetAmount}/> · {goal.destinationAccountName}</p><p className="mt-1 text-xs font-medium text-pocket-700">{overTarget ? <>Over target by <Money value={goal.overBy}/></> : percentage === 100 ? "Target reached" : <><Money value={goal.remaining}/> remaining</>}</p><button className="btn-secondary mt-4 w-full" disabled={accounts.isLoading || accounts.isError || goal.status !== "ACTIVE"} onClick={() => openContribution(goal)}>{goal.status === "ACTIVE" ? "Add contribution" : goal.status.toLowerCase()}</button></div>; })}</div>}
    {!goals.isLoading && !goals.error && !goals.data?.length && <Empty title="No goals yet" text={accounts.isSuccess && !availableAccounts.length ? "Create an account first before adding a savings or emergency fund goal." : "Create a savings or emergency fund target."} action={accounts.isSuccess && !availableAccounts.length ? <Link className="btn-primary" to="/accounts">Create account</Link> : undefined}/>}

    {dialog && <Modal title={dialog.type === "budget" ? "New monthly budget" : dialog.type === "goal" ? "New savings goal" : `Fund ${dialog.goal.name}`} close={closeDialog}><form className="space-y-5" onSubmit={submit}>
      {dialog.type === "budget" && <label className="block"><span className="label">Expense category</span><select className="input" name="categoryId" required><option value="">Choose category</option>{availableBudgetCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
      {dialog.type === "goal" && <><label className="block"><span className="label">Goal name</span><input className="input" name="name" maxLength={80} pattern=".*\S.*" title="Enter a goal name" required/></label><label className="block"><span className="label">Goal type</span><select className="input" name="type"><option value="SAVINGS">Savings</option><option value="EMERGENCY_FUND">Emergency fund</option></select><span className="mt-1.5 block text-xs text-slate-500">An emergency fund is tracked as a goal, not a separate banking product.</span></label><label className="block"><span className="label">Destination account</span><select className="input" name="accountId" required><option value="">Choose account</option>{availableAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="block"><span className="label">Target date <span className="font-normal text-slate-400">(optional)</span></span><input className="input" type="date" name="targetDate"/></label></>}
      {dialog.type === "contribute" && <><div className="rounded-xl border border-pocket-200 bg-pocket-50 p-3 text-xs text-pocket-900">This updates your AccPocket records by moving value into {dialog.goal.destinationAccountName}. It does not move real money or count as income, expenses, or budget spending.</div><label className="block"><span className="label">From account</span><select className="input" name="accountId" required><option value="">Choose account</option>{contributionAccounts(accounts.data, dialog.goal.destinationAccountId).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="block"><span className="label">Date</span><input className="input" type="date" name="date" defaultValue={localDateInputValue()} required/></label><label className="block"><span className="label">Description</span><input className="input" name="description" maxLength={120} pattern=".*\S.*" title="Enter a description" defaultValue={`Contribution to ${dialog.goal.name}`} required/></label><label className="block"><span className="label">Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea className="input min-h-20 py-3" name="notes" maxLength={500}/></label></>}
      {dialog.type === "budget" ? <label className="block"><span className="label">Monthly limit</span><input className="input-amount" name="amount" type="number" inputMode="decimal" min="0.0001" max="999999999999999.9999" step="0.0001" placeholder="0.00" required/><span className="mt-1.5 block text-xs text-slate-500">For {month}. Enter a value greater than zero with up to 4 decimal places.</span></label> : <label className="block"><span className="label">{dialog.type === "goal" ? "Target amount" : "Contribution amount"}</span><input className="input-amount" name="amount" type="number" inputMode="decimal" min="0.0001" max="999999999999999.9999" step="0.0001" placeholder="0.00" required/><span className="mt-1.5 block text-xs text-slate-500">Enter a value greater than zero with up to 4 decimal places.</span></label>}
      {save.error && <ErrorBox error={save.error}/>}<button className="btn-primary w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>
    </form></Modal>}
  </Page>;
}
