"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerificarCorreo() {

  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="max-w-md w-full text-center space-y-6">

        <h1 className="text-2xl font-bold">
          Confirma tu correo
        </h1>

        <p className="text-gray-600">
          Te enviamos un enlace de confirmación a tu correo.
        </p>

        <Button
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Ir a iniciar sesión
        </Button>

      </div>

    </div>
  );
}