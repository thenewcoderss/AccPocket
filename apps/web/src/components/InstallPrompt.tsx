import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    const ready = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const installed = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!installEvent) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return <button className="fixed bottom-20 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-pocket-700 px-4 text-sm font-semibold text-white shadow-button transition hover:bg-pocket-800 sm:bottom-5" onClick={install} type="button"><Download size={17}/>Install app</button>;
}
