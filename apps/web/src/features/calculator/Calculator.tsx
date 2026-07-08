import { useEffect, useReducer } from "react";
import { Page } from "../../components/ui";
import { BACKSPACE_KEY, calculatorKeys, calculatorLabel, calculatorReducer, DIVIDE_KEY, initialCalculatorState, keyboardToCalculatorKey, MULTIPLY_KEY, SUBTRACT_KEY } from "./model";

export function Calculator() {
  const [state, press] = useReducer(calculatorReducer, initialCalculatorState);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = keyboardToCalculatorKey(event.key);
      if (!key) return;
      event.preventDefault();
      press(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return <Page title="Calculator" description="A quick utility for everyday amounts. It does not save or change financial records.">
    <div className="mx-auto max-w-sm rounded-[28px] bg-slate-950 p-4 shadow-card sm:p-5">
      <div className="mb-4 min-h-24 overflow-x-auto rounded-2xl border border-white/5 bg-slate-900 p-5 text-right text-4xl font-light tabular-nums text-white outline-none" aria-label="Calculator display" aria-live="polite" role="status">{state.display}</div>
      <div className="grid grid-cols-4 gap-2">{calculatorKeys.map(key => <button key={key} type="button" onClick={() => press(key)} aria-label={calculatorLabel(key)} className={`${key === "=" ? "row-span-2 bg-pocket-600 hover:bg-pocket-500 focus-visible:ring-pocket-300" : [DIVIDE_KEY, MULTIPLY_KEY, SUBTRACT_KEY, "+"].includes(key) ? "bg-slate-700 hover:bg-slate-600 focus-visible:ring-slate-300" : key === "C" || key === BACKSPACE_KEY ? "bg-slate-800 text-teal-200 hover:bg-slate-700 focus-visible:ring-teal-200" : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-white/70"} min-h-14 rounded-2xl text-lg font-semibold text-white transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}>{key}</button>)}</div>
      <p className="mt-4 text-center text-xs text-slate-400">Use touch, mouse, or keyboard. Calculator results are not posted to accounts, budgets, goals, or reports.</p>
    </div>
  </Page>;
}
