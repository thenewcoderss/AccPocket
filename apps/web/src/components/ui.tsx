import { useEffect, useRef, type ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";

export function Page({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
    <header className="mb-6 flex min-w-0 items-start justify-between gap-3 sm:mb-8">
      <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}</div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
    {children}
  </section>;
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="card flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Inbox size={23}/></span><p className="mt-4 font-bold text-slate-900">{title}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function Spinner() {
  return <div className="grid min-h-64 place-items-center" role="status"><LoaderCircle className="h-8 w-8 animate-spin text-pocket-700"/><span className="sr-only">Loading</span></div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={18}/><span>{error instanceof Error ? error.message : "Something went wrong. Please try again."}</span></div>;
}

export function Modal({ title, close, children }: { title: string; close(): void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [close]);
  return <div className="fixed inset-0 z-50 grid items-end bg-slate-950/50 backdrop-blur-[2px] sm:place-items-center sm:p-4" onMouseDown={event => event.target === event.currentTarget && close()}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4"><h2 id="dialog-title" className="text-xl font-bold tracking-tight">{title}</h2><button className="icon-button bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={close} aria-label="Close dialog"><X size={19}/></button></div>{children}
    </div>
  </div>;
}

export function Money({ value, currency = "BDT", className = "" }: { value: string | number; currency?: string; className?: string }) {
  return <span className={`money ${className}`}>{new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value))}</span>;
}

export function Progress({ value, label, tone = "brand" }: { value: number; label: string; tone?: "brand" | "warning" | "danger" }) {
  const color = tone === "danger" ? "bg-red-600" : tone === "warning" ? "bg-amber-600" : "bg-pocket-600";
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, Math.max(0, value)))}><div className={`progress-bar ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }}/></div>;
}
