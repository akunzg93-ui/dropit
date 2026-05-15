"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

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

    const handler = (e) => {
      e.preventDefault();

      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
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

  if (isStandalone) return null;

  if (isIOS) {
    return (
      <div
        className="
          fixed
          bottom-24
          left-1/2
          -translate-x-1/2
          z-50
          w-[92%]
          max-w-sm
          rounded-3xl
          border
          border-blue-100
          bg-white/95
          backdrop-blur-xl
          shadow-2xl
          p-4
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-blue-100
            "
          >
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Instala Dropit
            </h3>

            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Presiona compartir y luego{" "}
              <span className="font-medium text-blue-600">
                “Agregar a pantalla de inicio”
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!showInstall) return null;

  return (
    <div
      className="
        fixed
        bottom-24
        left-1/2
        -translate-x-1/2
        z-50
        w-[92%]
        max-w-sm
        rounded-3xl
        border
        border-blue-100
        bg-white/95
        backdrop-blur-xl
        shadow-2xl
        p-4
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            bg-blue-100
          "
        >
          <Download className="h-5 w-5 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">
            Instala Dropit
          </h3>

          <p className="text-sm text-slate-600">
            Accede más rápido desde tu pantalla principal.
          </p>
        </div>

        <button
          onClick={handleInstall}
          className="
            rounded-xl
            bg-blue-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
          "
        >
          Instalar
        </button>
      </div>
    </div>
  );
}