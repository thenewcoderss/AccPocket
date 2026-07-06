import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { api } from "../../lib/api";
import { Empty, ErrorBox, Money, Page, Spinner } from "../../components/ui";

type Report = { currency: string; income: string; expenses: string; netCashFlow: string; totalBalance: string; categories: Array<{ name: string; amount: string; color: string }>; transactions: Array<{ id: string; date: string; description: string; type: string; amount: string }> };

export function Reports() {
  const [period, setPeriod] = useState("month");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [exportError, setExportError] = useState<unknown>();
  const [exported, setExported] = useState(false);
  const q = useQuery({ queryKey: ["report", period], queryFn: () => api.get<Report>(`/reports/summary?period=${period}`) });
  if (q.isLoading) return <Spinner/>;
  if (q.error) return <Page title="Reports"><ErrorBox error={q.error}/></Page>;

  async function download(type: "pdf" | "excel") {
    setExporting(type); setExportError(undefined); setExported(false);
    try { await api.download(`/reports/export/${type}?period=${period}`); setExported(true); }
    catch (error) { setExportError(error); }
    finally { setExporting(null); }
  }

  const hasData = Boolean(q.data?.transactions.length || q.data?.categories.length);
  return <Page title="Reports" description="Understand your cash flow and keep useful records." action={<label><span className="sr-only">Report period</span><select className="input !w-auto" value={period} onChange={event => setPeriod(event.target.value)}><option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select></label>}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Income", q.data?.income, "text-green-700"], ["Expenses", q.data?.expenses, "text-red-600"], ["Net flow", q.data?.netCashFlow, "text-pocket-700"], ["Balance", q.data?.totalBalance, "text-slate-900"]].map(([label, value, color]) => <div className="card min-w-0" key={label}><p className="text-xs font-medium text-slate-500">{label}</p><Money value={value ?? 0} currency={q.data?.currency} className={`mt-2 block break-words font-bold sm:text-lg ${color}`}/></div>)}</div>
    {hasData ? <section className="card mt-5"><h2 className="section-title">Spending by category</h2><p className="mt-1 text-sm text-slate-500">A category view for the selected period</p><div className="mt-5 h-64" aria-hidden="true"><ResponsiveContainer><BarChart data={q.data?.categories} layout="vertical" margin={{ left: 2, right: 12 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }}/><YAxis type="category" dataKey="name" width={76} tick={{ fontSize: 11, fill: "#475569" }}/><Tooltip formatter={value => new Intl.NumberFormat("en-BD", { style: "currency", currency: q.data?.currency ?? "BDT" }).format(Number(value))}/><Bar dataKey="amount" fill="#0d9488" radius={[0, 7, 7, 0]}/></BarChart></ResponsiveContainer></div><div className="border-t border-slate-100 pt-4" aria-label="Spending by category values">{q.data?.categories.map(category => <div className="flex items-center justify-between gap-3 py-1.5 text-sm" key={category.name}><span className="text-slate-600">{category.name}</span><Money value={category.amount} currency={q.data?.currency} className="font-semibold"/></div>)}</div></section> : <div className="mt-5"><Empty title="No report data" text="Record income or expenses to see a report for this period."/></div>}
    <section className="mt-5"><h2 className="section-title">Export records</h2><p className="mt-1 text-sm text-slate-500">Save a copy for your records or bookkeeping.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button className="btn-primary" disabled={Boolean(exporting)} onClick={() => void download("pdf")}><Download size={18}/>{exporting === "pdf" ? "Preparing PDF..." : "Download PDF"}</button><button className="btn-secondary" disabled={Boolean(exporting)} onClick={() => void download("excel")}><FileSpreadsheet size={18}/>{exporting === "excel" ? "Preparing Excel..." : "Download Excel"}</button></div>{Boolean(exportError) && <div className="mt-3"><ErrorBox error={exportError}/></div>}{exported && <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">Your report download is ready.</p>}</section>
    <p className="mt-6 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600">Reports are bookkeeping records. AccPocket does not move real money.</p>
  </Page>;
}
