"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerificarVendedor() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted/30">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 text-center">

        {/* Badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Verificación requerida
          </span>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Confirma tu correo electrónico
        </h1>

        {/* Texto */}
        <p className="text-sm text-gray-600 mb-6">
          Te enviamos un correo con un enlace para activar tu cuenta.
          <br />
          Revisa tu bandeja de entrada o spam.
        </p>

        {/* Botón */}
        <Button
          className="w-full"
          onClick={() => router.push("/vendedor/login")}
        >
          Ir a iniciar sesión
        </Button>

        {/* Texto pequeño */}
        <p className="text-xs text-gray-500 mt-4">
          Si no recibiste el correo, espera unos minutos o intenta registrarte nuevamente.
        </p>

      </div>
    </div>
  );
}
