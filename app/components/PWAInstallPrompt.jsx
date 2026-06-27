"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;

    setIsIOS(ios);
    setIsStandalone(standalone);

    const showTimer = setTimeout(() => {
      if (!standalone) {
        setShowInstall(true);
      }
    }, 1000);

    const hideTimer = setTimeout(() => {
      setShowInstall(false);
    }, 6000);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstall(false);
    }
  }

  function closePrompt() {
    setShowInstall(false);
  }

  if (isStandalone || !showInstall) return null;

  return (
    <div className="fixed bottom-32 left-1/2 z-50 w-[90%] max-w-xs -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl px-4 py-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={closePrompt}
        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 pr-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
          {isIOS ? (
            <Smartphone className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#1e3a8a]">
            Instala Dropit
          </h3>

          {isIOS ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Toca Compartir →{" "}
              <span className="font-medium text-[#2563eb]">
                Agregar a inicio
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-1 text-xs font-medium text-[#2563eb] transition hover:text-[#1e40af]"
            >
              Instalar aplicación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}