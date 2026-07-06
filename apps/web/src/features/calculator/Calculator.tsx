import { useEffect, useState } from "react";
import { Page } from "../../components/ui";
import { calculate } from "../../lib/money";

const keys = ["C", "⌫", "÷", "×", "7", "8", "9", "−", "4", "5", "6", "+", "1", "2", "3", "=", "0", "00", "."];
export function Calculator() {
  const [display, setDisplay] = useState("0"), [stored, setStored] = useState<number | null>(null), [op, setOp] = useState<string | null>(null), [fresh, setFresh] = useState(true);
  function press(key: string) {
    if (/^\d|00|\.$/.test(key)) { setDisplay(value => fresh ? (key === "." ? "0." : key) : (key === "." && value.includes(".") ? value : value + key)); setFresh(false); return; }
    if (key === "C") { setDisplay("0"); setStored(null); setOp(null); setFresh(true); return; }
    if (key === "⌫") { setDisplay(value => value.length > 1 ? value.slice(0, -1) : "0"); return; }
    if (key === "=") { if (stored === null || !op) return; try { setDisplay(String(calculate(stored, op, Number(display)))); } catch { setDisplay("Error"); } setStored(null); setOp(null); setFresh(true); return; }
    setStored(Number(display)); setOp(key); setFresh(true);
  }
  useEffect(() => { const handler = (event: KeyboardEvent) => { const map: Record<string, string> = { "/": "÷", "*": "×", "-": "−", Enter: "=", Escape: "C", Backspace: "⌫" }; const key = map[event.key] ?? event.key; if (keys.includes(key)) press(key); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  return <Page title="Calculator" description="A quick calculator for everyday amounts."><div className="mx-auto max-w-sm rounded-[28px] bg-slate-950 p-4 shadow-card sm:p-5"><div className="mb-4 min-h-24 overflow-x-auto rounded-2xl border border-white/5 bg-slate-900 p-5 text-right text-4xl font-light tabular-nums text-white" aria-live="polite">{display}</div><div className="grid grid-cols-4 gap-2">{keys.map(key => <button key={key} onClick={() => press(key)} aria-label={key === "⌫" ? "Backspace" : key === "C" ? "Clear" : key} className={`${key === "=" ? "row-span-2 bg-pocket-600 hover:bg-pocket-500" : /[÷×−+]/.test(key) ? "bg-slate-700 hover:bg-slate-600" : key === "C" || key === "⌫" ? "bg-slate-800 text-teal-200 hover:bg-slate-700" : "bg-slate-900 hover:bg-slate-800"} min-h-14 rounded-2xl text-lg font-semibold text-white transition active:scale-95`}>{key}</button>)}</div></div></Page>;
}
