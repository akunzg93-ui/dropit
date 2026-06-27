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
        setEntregados(pedidos.filter((p) => p.estado === "entregado").length);
      }

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
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div className="grid md:grid-cols-[1.4fr_.8fr] gap-8 items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] leading-tight">
                Panel del vendedor <span className="inline-block">📦</span>
              </h1>

              <p className="text-slate-600 mt-4 max-w-xl text-lg">
                Gestiona tus envíos, revisa tus coins y mantén tu operación en
                movimiento desde un solo lugar.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3">
                🪙 Coins disponibles
              </p>

              <div className="grid grid-cols-2 gap-3">
                <CoinBalanceCard label="Coins pequeñas" value={smallCoins} />

                <CoinBalanceCard label="Coins medianas" value={mediumCoins} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            icon={<Clock size={20} />}
            label="Pendientes"
            value={pendientes}
            tone="amber"
          />

          <MetricCard
            icon={<Truck size={20} />}
            label="En tránsito"
            value={enTransito}
            tone="blue"
          />

          <MetricCard
            icon={<CheckCircle size={20} />}
            label="Entregados"
            value={entregados}
            tone="emerald"
          />
        </section>

        <section className="bg-gradient-to-r from-[#2563eb] to-[#1e40af] rounded-3xl p-6 md:p-8 shadow-sm text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <Coins size={24} />
                <h2 className="text-2xl font-bold">¿Necesitas más coins?</h2>
              </div>

              <p className="text-blue-100 mt-2">
                Compra más coins para seguir creando pedidos sin interrupciones.
              </p>
            </div>

            <Button
              className="bg-white text-[#1e40af] font-semibold hover:bg-slate-100 rounded-xl"
              onClick={() => router.push("/vendedor/coins")}
            >
              Comprar Coins
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <ActionCard
            icon={<PlusCircle size={24} />}
            title="Crear pedido"
            description="Registra un nuevo envío y selecciona los establecimientos donde podrá recibirse."
            buttonLabel="Crear pedido"
            onClick={() => router.push("/vendedor/crear-pedido")}
            primary
          />

          <ActionCard
            icon={<ClipboardList size={24} />}
            title="Ver mis pedidos"
            description="Consulta el estado, seguimiento y detalle de todos tus envíos."
            buttonLabel="Ver mis pedidos"
            onClick={() => router.push("/vendedor/pedidos")}
          />
        </section>
      </div>
    </div>
  );
}

function CoinBalanceCard({ label, value }) {
  return (
    <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50 text-[#1e3a8a]">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-600 border-amber-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-blue-50 text-[#2563eb] border-blue-100";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneClass}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>

      <p className="text-3xl font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonLabel, onClick, primary }) {
  return (
    <div className="bg-white border border-slate-200 p-7 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
            primary
              ? "bg-blue-50 text-[#2563eb]"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </div>

        <h2 className="text-xl font-bold text-[#1e3a8a]">{title}</h2>
      </div>

      <p className="text-slate-600 text-sm mb-8">{description}</p>

      <Button
        className={`w-full h-12 text-base rounded-xl ${
          primary
            ? "bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
        }`}
        variant={primary ? undefined : "secondary"}
        onClick={onClick}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}