import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Calculator, Home, Landmark, MoreHorizontal, Plus, WalletCards } from "lucide-react";

const links = [{ to: "/", label: "Home", icon: Home }, { to: "/accounts", label: "Accounts", icon: WalletCards }, { to: "/transactions", label: "Activity", icon: Landmark }, { to: "/reports", label: "Reports", icon: BarChart3 }, { to: "/more", label: "More", icon: MoreHorizontal }];

export function Shell() {
  return <div className="min-h-screen">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight text-pocket-900" aria-label="AccPocket home"><span className="grid h-9 w-9 place-items-center rounded-[14px] bg-pocket-700 text-white shadow-button">A</span><span className="hidden min-[360px]:inline">AccPocket</span></NavLink>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 sm:flex" aria-label="Primary navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${isActive ? "bg-pocket-50 text-pocket-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={18}/><span className="hidden lg:inline">{label}</span></NavLink>)}</nav>
        <div className="flex shrink-0 gap-2"><NavLink to="/calculator" className="icon-button bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Open calculator"><Calculator size={19}/></NavLink><NavLink to="/transactions?add=expense" className="btn-primary !px-3 sm:!px-4"><Plus size={18}/><span className="hidden min-[420px]:inline">Add entry</span></NavLink></div>
      </div>
    </header>
    <main><Outlet/></main>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,.06)] backdrop-blur-xl sm:hidden" aria-label="Mobile navigation"><div className="grid grid-cols-5">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? "bg-pocket-50/70 text-pocket-700" : "text-slate-500"}`}><Icon size={21}/>{label}</NavLink>)}</div></nav>
  </div>;
}
