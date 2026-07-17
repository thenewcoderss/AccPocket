import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { InstallPrompt } from "../components/InstallPrompt";
import { ErrorBox, Page, Spinner } from "../components/ui";
import { useAuth } from "../store/auth";
import { Shell } from "./Shell";

const AuthPage = lazy(() => import("../features/auth/AuthPages").then(module => ({ default: module.AuthPage })));
const UnlockPage = lazy(() => import("../features/auth/AuthPages").then(module => ({ default: module.UnlockPage })));
const Dashboard = lazy(() => import("../features/dashboard/Dashboard").then(module => ({ default: module.Dashboard })));
const Accounts = lazy(() => import("../features/accounts/Accounts").then(module => ({ default: module.Accounts })));
const Transactions = lazy(() => import("../features/transactions/Transactions").then(module => ({ default: module.Transactions })));
const Planning = lazy(() => import("../features/planning/Planning").then(module => ({ default: module.Planning })));
const Reports = lazy(() => import("../features/reports/Reports").then(module => ({ default: module.Reports })));
const Calculator = lazy(() => import("../features/calculator/Calculator").then(module => ({ default: module.Calculator })));
const Settings = lazy(() => import("../features/settings/Settings").then(module => ({ default: module.Settings })));
const More = lazy(() => import("../features/settings/Settings").then(module => ({ default: module.More })));

class LazyLoadBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown, info: ErrorInfo) { console.error("Route failed to load", error, info); }
  render() {
    if (this.state.error) return <Page title="Unable to load this screen"><ErrorBox error={this.state.error}/><button className="btn-secondary mt-3" onClick={() => location.reload()}>Reload AccPocket</button></Page>;
    return this.props.children;
  }
}

function Protected() {
  const auth = useAuth();
  if (!auth.ready) return <Spinner/>;
  if (!auth.user) return <Navigate to="/login"/>;
  if (auth.user.passcodeEnabled && !auth.unlocked) return <Navigate to="/unlock"/>;
  return <Shell/>;
}

function CalculatorAccess() {
  const auth = useAuth();
  if (!auth.ready) return <Spinner/>;
  if (auth.user?.passcodeEnabled && !auth.unlocked) return <Navigate to="/unlock"/>;
  return auth.user ? <Shell/> : <Outlet/>;
}

export function App() {
  return <>
    <LazyLoadBoundary>
      <Suspense fallback={<Spinner/>}>
        <Routes>
          <Route path="/login" element={<AuthPage/>}/>
          <Route path="/signup" element={<AuthPage signup/>}/>
          <Route path="/unlock" element={<UnlockPage/>}/>
          <Route element={<CalculatorAccess/>}>
            <Route path="calculator" element={<Calculator/>}/>
          </Route>
          <Route element={<Protected/>}>
            <Route index element={<Dashboard/>}/>
            <Route path="accounts" element={<Accounts/>}/>
            <Route path="transactions" element={<Transactions/>}/>
            <Route path="planning" element={<Planning/>}/>
            <Route path="reports" element={<Reports/>}/>
            <Route path="settings" element={<Settings/>}/>
            <Route path="more" element={<More/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </Suspense>
    </LazyLoadBoundary>
    <InstallPrompt/>
  </>;
}
