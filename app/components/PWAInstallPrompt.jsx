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

    const timer = setTimeout(() => {
      if (!standalone) {
        setShowInstall(true);
      }
    }, 5000);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timer);
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
    <div
      className="
        fixed
        bottom-32
        left-1/2
        -translate-x-1/2
        z-50
        w-[90%]
        max-w-xs
        rounded-2xl
        border
        border-white/60
        bg-white/85
        backdrop-blur-2xl
        shadow-2xl
        px-4
        py-3
        animate-in
        fade-in
        slide-in-from-bottom-4
        duration-300
      "
    >
      <button
        onClick={closePrompt}
        className="
          absolute
          right-2
          top-2
          rounded-full
          p-1
          text-slate-400
          transition
          hover:bg-slate-100
          hover:text-slate-600
        "
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 pr-5">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-blue-100
          "
        >
          {isIOS ? (
            <Smartphone className="h-5 w-5 text-blue-600" />
          ) : (
            <Download className="h-5 w-5 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            Instala Dropit
          </h3>

          {isIOS ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Toca Compartir →{" "}
              <span className="font-medium text-blue-600">
                Agregar a inicio
              </span>
            </p>
          ) : (
            <button
              onClick={handleInstall}
              className="
                mt-1
                text-xs
                font-medium
                text-blue-600
                transition
                hover:text-blue-700
              "
            >
              Instalar aplicación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}