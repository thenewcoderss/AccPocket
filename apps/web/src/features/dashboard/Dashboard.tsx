import { useQuery } from "@tanstack/react-query";
import type { DashboardDto } from "@accpocket/shared";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, ReceiptText, WalletCards } from "lucide-react";
import { api } from "../../lib/api";
import { Empty, ErrorBox, Money, Page, Progress, Spinner } from "../../components/ui";
import { useAuth } from "../../store/auth";
import { formatTransactionDate } from "../transactions/date";

export function Dashboard() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<DashboardDto>("/dashboard?period=month") });
  if (q.isLoading) return <Spinner/>;
  if (q.error) return <Page title="Home"><ErrorBox error={q.error}/></Page>;
  const d = q.data!;
  return <Page title={`Hello, ${user?.name.split(" ")[0]}`} description="Here’s a clear view of your money this month.">
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-pocket-700 via-pocket-800 to-pocket-900 p-5 text-white shadow-card sm:p-7">
      <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/5"/><div className="absolute -bottom-20 right-16 h-40 w-40 rounded-full bg-teal-300/5"/>
      <div className="relative"><span className="mb-5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-teal-50"><WalletCards size={20}/></span><p className="text-sm font-medium text-teal-100">Total balance</p><Money value={d.totalBalance} currency={user?.defaultCurrency} className="mt-1 block break-words text-3xl font-bold sm:text-4xl"/><p className="mt-6 text-xs font-medium text-teal-100">Across {d.accounts.length} active account{d.accounts.length === 1 ? "" : "s"}</p></div>
    </section>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="card min-w-0"><span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-700"><ArrowDownLeft size={20}/></span><p className="mt-4 text-xs font-medium text-slate-500">Income this month</p><Money value={d.income} currency={user?.defaultCurrency} className="mt-1 block break-words font-bold text-green-700 sm:text-lg"/></div>
      <div className="card min-w-0"><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><ArrowUpRight size={20}/></span><p className="mt-4 text-xs font-medium text-slate-500">Spent this month</p><Money value={d.expenses} currency={user?.defaultCurrency} className="mt-1 block break-words font-bold text-red-600 sm:text-lg"/></div>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <section className="card"><h2 className="section-title">Spending breakdown</h2><p className="mt-1 text-sm text-slate-500">Where your expenses went this month</p>{d.spendingByCategory.length ? <><div className="mt-3 h-52" aria-hidden="true"><ResponsiveContainer><PieChart><Pie data={d.spendingByCategory} dataKey="amount" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>{d.spendingByCategory.map(x => <Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip formatter={value => new Intl.NumberFormat("en-BD", { style: "currency", currency: user?.defaultCurrency ?? "BDT" }).format(Number(value))}/></PieChart></ResponsiveContainer></div><ul className="grid gap-2" aria-label="Spending by category">{d.spendingByCategory.map(item => <li key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }}/><span className="truncate text-slate-600">{item.name}</span></span><Money value={item.amount} currency={user?.defaultCurrency} className="shrink-0 font-semibold"/></li>)}</ul></> : <div className="py-10 text-center"><ReceiptText className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-600">No expenses this month</p></div>}</section>
      <section><h2 className="section-title">Recent activity</h2><p className="mb-3 mt-1 text-sm text-slate-500">Your latest recorded entries</p>{d.recentTransactions.length ? <div className="space-y-2">{d.recentTransactions.map(t => <div className="card flex min-w-0 items-center justify-between gap-3" key={t.id}><div className="min-w-0"><p className="truncate font-semibold">{t.description}</p><p className="mt-1 truncate text-xs text-slate-500">{formatTransactionDate(t.date)} · {t.type === "TRANSFER" ? `${t.accountName} → ${t.destinationAccountName}` : t.accountName}</p></div><div className="shrink-0 text-right"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{t.type === "EXPENSE" ? "Expense" : t.type === "INCOME" ? "Income" : "Transfer"}</span><Money value={t.amount} currency={user?.defaultCurrency} className={t.type === "EXPENSE" ? "font-bold text-red-600" : t.type === "INCOME" ? "font-bold text-green-700" : "font-bold text-slate-700"}/></div></div>)}</div> : <Empty title="No activity yet" text="Add an account, then record your first income, expense, or transfer."/>}</section>
    </div>
    {d.goals.length > 0 && <section className="mt-8"><h2 className="section-title">Savings goals</h2><p className="mb-3 mt-1 text-sm text-slate-500">Small steps toward what matters</p><div className="grid gap-3 sm:grid-cols-2">{d.goals.map(g => { const progress = Number(g.saved) / Number(g.target) * 100; return <div className="card" key={g.id}><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-pocket-50 text-pocket-700"><PiggyBank size={20}/></span><b>{g.name}</b></div><div className="mt-5"><Progress value={progress} label={`${g.name}: ${Math.round(progress)}% funded`}/></div><p className="mt-2 text-xs text-slate-500"><Money value={g.saved} currency={user?.defaultCurrency}/> of <Money value={g.target} currency={user?.defaultCurrency}/> · {Math.round(progress)}%</p></div>; })}</div></section>}
  </Page>;
}
