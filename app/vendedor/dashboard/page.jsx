"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardVendedor() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Modo Emprendedor
          </span>

          <h1 className="text-4xl font-bold mt-6 text-gray-900">
            Panel del Vendedor
          </h1>

          <p className="text-gray-600 mt-3">
            Gestiona tus envíos y administra tus pedidos fácilmente.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-6">

          {/* Crear Pedido */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              Crear Pedido
            </h2>

            <p className="text-white/90 text-sm mb-6">
              Registra un nuevo envío y selecciona el establecimiento de entrega.
            </p>

            <Button
              className="w-full py-6 text-lg bg-white text-blue-700 hover:bg-gray-100"
              onClick={() => router.push("/vendedor/crear-pedido")}
            >
              Crear Pedido
            </Button>
          </div>

          {/* Ver pedidos */}
          <div className="bg-white border p-8 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ver mis pedidos
            </h2>

            <p className="text-gray-600 text-sm mb-6">
              Consulta el estado y seguimiento de todos tus envíos.
            </p>

            <Button
              className="w-full py-6 text-lg"
              variant="secondary"
              onClick={() => router.push("/vendedor/mis-pedidos")}
            >
              Ver mis pedidos
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
