"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Package, Store, ShoppingCart } from "lucide-react";

export default function SeleccionarRol() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // 🔒 PROTEGER ACCESO SI NO CONFIRMÓ CORREO
  useEffect(() => {
    async function checkUser() {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 🔴 CLAVE: cerrar sesión si no confirmó
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        router.push("/verificar");
        return;
      }

    }

    checkUser();
  }, []);

  async function setRole(role: string) {
    setLoading(role);

    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const userId = data.session.user.id;

    await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (role === "vendor") router.push("/vendedor/dashboard");
    if (role === "establishment") router.push("/establecimiento");
    if (role === "buyer") router.push("/comprador");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">

      <div className="max-w-3xl w-full">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">
            ¿Cómo quieres usar Dropit?
          </h1>

          <p className="text-slate-500 mt-2">
            Selecciona el tipo de cuenta con el que quieres empezar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* EMPRENDEDOR */}

          <button
            onClick={() => setRole("vendor")}
            className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
              <Package size={24} />
            </div>

            <h2 className="font-semibold text-lg text-slate-800">
              Emprendedor
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Crea envíos y gestiona tus pedidos fácilmente.
            </p>

            {loading === "vendor" && (
              <p className="text-sm mt-3 text-blue-600">Configurando...</p>
            )}
          </button>


          {/* ESTABLECIMIENTO */}

          <button
            onClick={() => setRole("establishment")}
            className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 mb-4">
              <Store size={24} />
            </div>

            <h2 className="font-semibold text-lg text-slate-800">
              Establecimiento
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Recibe paquetes y administra entregas.
            </p>

            {loading === "establishment" && (
              <p className="text-sm mt-3 text-green-600">Configurando...</p>
            )}
          </button>


          {/* COMPRADOR */}

          <button
            onClick={() => setRole("buyer")}
            className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-200 text-slate-700 mb-4">
              <ShoppingCart size={24} />
            </div>

            <h2 className="font-semibold text-lg text-slate-800">
              Comprador
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Recoge tus pedidos en establecimientos cercanos.
            </p>

            {loading === "buyer" && (
              <p className="text-sm mt-3 text-slate-600">Configurando...</p>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}