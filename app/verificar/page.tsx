"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MailCheck, ShieldCheck, Clock3 } from "lucide-react";

export default function VerificarCorreo() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 text-center">
          
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <MailCheck className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            ¡Revisa tu correo!
          </h1>

          {/* Descripción */}
          <p className="text-slate-600 leading-relaxed mb-8">
            Te enviamos un enlace para activar tu cuenta de{" "}
            <span className="font-semibold text-indigo-600">
              Dropit
            </span>.
            <br />
            Una vez confirmado podrás comenzar a crear pedidos y gestionar tus entregas.
          </p>

          {/* Caja informativa */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">
              ¿No encuentras el correo?
            </h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Revisa tu carpeta de Spam o Correo no deseado.
              </div>

              <div className="flex items-center gap-3">
                <MailCheck className="w-4 h-4 text-indigo-600" />
                Revisa la pestaña de Promociones.
              </div>

              <div className="flex items-center gap-3">
                <Clock3 className="w-4 h-4 text-indigo-600" />
                Espera unos minutos y actualiza tu bandeja.
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg"
          >
            Ya confirmé mi correo
          </Button>

          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-slate-500 hover:text-indigo-600 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}