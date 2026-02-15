"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center px-4 pt-28">
      {/* ⬆️ antes estaba centrado verticalmente, ahora arranca más arriba */}

      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2d6cdf] mb-2">
          ¿Qué quieres hacer hoy?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Elige cómo vas a usar <span className="font-semibold">DROPIT</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* VENDEDOR */}
        <div className="bg-white dark:bg-gray-900 border rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2d6cdf] mb-2">
              Soy Vendedor
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quiero enviar paquetes y elegir dónde se entregan.
            </p>
          </div>
          <Link
            href="/vendedor/register"
            className="mt-6 inline-block text-center bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800"
          >
            Registrarme como Vendedor
          </Link>
        </div>

        {/* COMPRADOR */}
        <div className="bg-white dark:bg-gray-900 border rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2d6cdf] mb-2">
              Soy Comprador
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quiero rastrear y recoger mis pedidos.
            </p>
          </div>
          <Link
            href="/comprador/register"
            className="mt-6 inline-block text-center bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800"
          >
            Registrarme como Comprador
          </Link>
        </div>

        {/* ESTABLECIMIENTO */}
        <div className="bg-white dark:bg-gray-900 border rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2d6cdf] mb-2">
              Soy Establecimiento
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recibo paquetes y los entrego a clientes.
            </p>
          </div>
          <Link
            href="/establecimiento/register"
            className="mt-6 inline-block text-center bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800"
          >
            Registrar Establecimiento
          </Link>
        </div>
      </div>
    </main>
  );
}
