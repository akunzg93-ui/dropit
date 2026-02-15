"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardVendedor() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-muted/20">
      <h1 className="text-4xl font-bold mt-16 mb-10 text-primary">
        Panel del Vendedor
      </h1>

      <div className="w-full max-w-md space-y-4">
        <Button
          className="w-full py-6 text-lg"
          onClick={() => router.push("/vendedor/crear-pedido")}
        >
          Crear Pedido
        </Button>

        <Button
          className="w-full py-6 text-lg"
          variant="secondary"
          onClick={() => router.push("/vendedor/mis-pedidos")}
        >
          Ver mis pedidos
        </Button>
      </div>
    </div>
  );
}
