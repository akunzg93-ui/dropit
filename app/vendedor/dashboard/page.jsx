"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  ClipboardList,
  Coins,
  Truck,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function DashboardVendedor() {
  const router = useRouter();

  const [pendientes, setPendientes] = useState(0);
  const [enTransito, setEnTransito] = useState(0);
  const [entregados, setEntregados] = useState(0);

  const [smallCoins, setSmallCoins] = useState(0);
  const [mediumCoins, setMediumCoins] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 🔹 PEDIDOS
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("estado")
        .eq("vendedor_id", user.id);

      if (pedidos) {
        setPendientes(
          pedidos.filter((p) => p.estado === "pendiente_recoleccion").length
        );
        setEnTransito(
          pedidos.filter((p) => p.estado === "en_transito").length
        );
        setEntregados(
          pedidos.filter((p) => p.estado === "entregado").length
        );
      }

      // 🔹 COINS
      const { data: lotes } = await supabase
        .from("coin_lotes")
        .select("tipo, cantidad_disponible")
        .eq("user_id", user.id);

      if (lotes) {
        const small = lotes
          .filter((l) => l.tipo === "small")
          .reduce((acc, l) => acc + l.cantidad_disponible, 0);

        const medium = lotes
          .filter((l) => l.tipo === "medium")
          .reduce((acc, l) => acc + l.cantidad_disponible, 0);

        setSmallCoins(small);
        setMediumCoins(medium);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen px-6 py-16 bg-slate-50">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Modo Emprendedor
          </span>

          <h1 className="text-4xl font-bold mt-6 text-indigo-900">
            Panel del Vendedor
          </h1>

          <p className="text-slate-600 mt-3 text-lg">
            Gestiona tu operación logística desde un solo lugar.
          </p>
        </div>

        {/* MINI MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          <MetricCard
            icon={<Clock className="text-amber-500" size={20} />}
            label="Pendientes"
            value={pendientes}
          />

          <MetricCard
            icon={<Truck className="text-sky-500" size={20} />}
            label="En tránsito"
            value={enTransito}
          />

          <MetricCard
            icon={<CheckCircle className="text-emerald-500" size={20} />}
            label="Entregados"
            value={entregados}
          />

        </div>

        {/* COINS CARD */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 shadow-lg text-white">
            <div className="flex items-center justify-between flex-col md:flex-row gap-6">

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Coins size={24} />
                  <h2 className="text-xl font-semibold">
                    Coins disponibles
                  </h2>
                </div>

                <div className="flex gap-8 mt-4 text-lg font-bold">
                  <div>
                    <p className="text-white/70 text-sm font-medium">Small</p>
                    <p>{smallCoins}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">Medium</p>
                    <p>{mediumCoins}</p>
                  </div>
                </div>

                <p className="text-white/80 text-sm mt-3">
                  Utiliza tus coins para registrar nuevos envíos.
                </p>
              </div>

              <Button
                className="bg-white text-indigo-700 font-semibold hover:bg-slate-100"
                onClick={() => router.push("/vendedor/coins")}
              >
                Comprar Coins
              </Button>

            </div>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div className="space-y-8">

          <ActionCard
            icon={<PlusCircle className="text-indigo-600" size={24} />}
            title="Crear Pedido"
            description="Registra un nuevo envío y selecciona el establecimiento de entrega."
            buttonLabel="Crear Pedido"
            onClick={() => router.push("/vendedor/crear-pedido")}
            primary
          />

          <ActionCard
            icon={<ClipboardList className="text-slate-600" size={24} />}
            title="Ver mis pedidos"
            description="Consulta el estado y seguimiento de todos tus envíos."
            buttonLabel="Ver mis pedidos"
            onClick={() => router.push("/vendedor/mis-pedidos")}
          />

        </div>

      </div>
    </div>
  );
}

/* COMPONENTES */

function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonLabel, onClick, primary }) {
  return (
    <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">

      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      <p className="text-slate-600 text-sm mb-8">
        {description}
      </p>

      <Button
        className={`w-full h-12 text-base rounded-xl ${
          primary
            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow hover:shadow-lg hover:scale-[1.01] transition-all"
            : ""
        }`}
        variant={primary ? undefined : "secondary"}
        onClick={onClick}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}