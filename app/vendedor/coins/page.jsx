"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabaseClient";
import CheckoutForm from "./checkout-form";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PRECIO_SMALL = 60;
const PRECIO_MEDIUM = 90;
const PAQUETE_10 = 10;

const CUPONES_VALIDOS = {
  DROPIT10: 0.1,
  BIENVENIDO15: 0.15,
};

export default function ComprarCoinsPage() {
  const router = useRouter();

  const [small, setSmall] = useState(0);
  const [medium, setMedium] = useState(0);
  const [cupon, setCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState("");
  const [mensajeCupon, setMensajeCupon] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);

  const [coinsDisponibles, setCoinsDisponibles] = useState({
    small: 0,
    medium: 0,
  });

  const subtotal = small * PRECIO_SMALL + medium * PRECIO_MEDIUM;
  const cantidadTotal = small + medium;

  const descuentoPorCantidad =
    cantidadTotal >= 50 ? 0.12 : cantidadTotal >= 10 ? 0.1 : 0;

  const descuentoCupon = cuponAplicado
    ? CUPONES_VALIDOS[cuponAplicado] || 0
    : 0;

  const descuentoFinal = Math.max(descuentoPorCantidad, descuentoCupon);
  const total = Math.round(subtotal * (1 - descuentoFinal));

  const items = [
    ...(small > 0 ? [{ tipo: "small", cantidad: small }] : []),
    ...(medium > 0 ? [{ tipo: "medium", cantidad: medium }] : []),
  ];

  const cargarCoins = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { data: lotes } = await supabase
      .from("coin_lotes")
      .select("tipo, cantidad_disponible")
      .eq("user_id", data.user.id)
      .gt("cantidad_disponible", 0)
      .gt("fecha_expiracion", new Date().toISOString());

    const resumen = { small: 0, medium: 0 };

    lotes?.forEach((l) => {
      if (l.tipo === "small") resumen.small += l.cantidad_disponible;
      if (l.tipo === "medium") resumen.medium += l.cantidad_disponible;
    });

    setCoinsDisponibles(resumen);
  };

  useEffect(() => {
    cargarCoins();
  }, []);

  const aplicarCupon = () => {
    const codigo = cupon.trim().toUpperCase();

    if (!codigo) {
      setMensajeCupon("Escribe un cupón.");
      return;
    }

    if (!CUPONES_VALIDOS[codigo]) {
      setCuponAplicado("");
      setMensajeCupon("Cupón no válido.");
      return;
    }

    setCuponAplicado(codigo);
    setMensajeCupon(`Cupón ${codigo} aplicado.`);
  };

  const quitarCupon = () => {
    setCupon("");
    setCuponAplicado("");
    setMensajeCupon("");
  };

  const handleSuccess = () => {
    setMensajeExito(true);
    setSmall(0);
    setMedium(0);
    setCupon("");
    setCuponAplicado("");
    setMensajeCupon("");
    cargarCoins();

    setTimeout(() => {
      router.push("/vendedor/crear-pedido?coins=ok");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {mensajeExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 font-semibold shadow-sm">
            ✅ Coins compradas correctamente. Te llevaremos a crear tu pedido.
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div className="grid md:grid-cols-[1.4fr_.8fr] gap-8 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
                Dropit Coins
              </p>

              <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mt-3 leading-tight">
                Compra coins <span className="inline-block">🪙</span>
              </h1>

              <p className="text-slate-600 mt-4 max-w-xl text-lg">
                Elige coins individuales o paquetes de 10 para seguir enviando
                con Dropit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SaldoCard
                label="Paquetes pequeños"
                value={coinsDisponibles.small}
              />
              <SaldoCard
                label="Paquetes medianos"
                value={coinsDisponibles.medium}
              />
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-7">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Compra individual
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
                Para compras puntuales
              </h2>
              <p className="text-slate-500 mt-2">
                Ideal si solo necesitas algunos envíos específicos.
              </p>
            </div>

            <div className="space-y-4">
              <CoinSelector
                title="Paquetes pequeños"
                description="Documentos, ropa, accesorios, libros o cajas pequeñas."
                price={PRECIO_SMALL}
                qty={small}
                setQty={setSmall}
              />

              <CoinSelector
                title="Paquetes medianos"
                description="Cajas medianas, equipo, maletas, muebles pequeños o artículos pesados."
                price={PRECIO_MEDIUM}
                qty={medium}
                setQty={setMedium}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-7">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100 font-semibold">
                Compra en paquete
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">
                Más coins, mejor precio
              </h2>
              <p className="text-blue-100 mt-2">
                Agrega 10 coins de golpe y recibe 10% de descuento.
              </p>
            </div>

            <div className="space-y-4">
              <PaqueteCard
                title="Pack pequeño"
                description="10 coins para paquetes pequeños."
                specs="Para documentos, ropa, accesorios, libros o cajas pequeñas."
                price={PRECIO_SMALL}
                setQty={setSmall}
              />

              <PaqueteCard
                title="Pack mediano"
                description="10 coins para paquetes medianos."
                specs="Para cajas medianas, equipo, maletas, muebles pequeños o artículos pesados."
                price={PRECIO_MEDIUM}
                setQty={setMedium}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="md:w-56">
              <p className="text-sm font-semibold text-[#1e3a8a]">
                ¿Tienes cupón?
              </p>
              <p className="text-xs text-slate-500">
                Aplícalo antes de pagar.
              </p>
            </div>

            <input
              value={cupon}
              onChange={(e) => setCupon(e.target.value)}
              placeholder="Ej. DROPIT10"
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={aplicarCupon}
              className="bg-[#2563eb] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl px-5 py-2.5"
            >
              Aplicar
            </button>

            {cuponAplicado && (
              <button
                type="button"
                onClick={quitarCupon}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-5 py-2.5"
              >
                Quitar
              </button>
            )}
          </div>

          {mensajeCupon && (
            <p
              className={`text-xs font-medium mt-3 ${
                cuponAplicado ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {mensajeCupon}
            </p>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="grid lg:grid-cols-[1fr_.8fr] gap-8 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Resumen
              </p>

              <div className="space-y-3 mt-5">
                <ResumenRow label="Subtotal" value={`$${subtotal} MXN`} />

                {descuentoFinal > 0 && (
                  <ResumenRow
                    label={
                      cuponAplicado
                        ? `Descuento por cupón ${cuponAplicado}`
                        : "Descuento por paquete"
                    }
                    value={`- ${Math.round(descuentoFinal * 100)}%`}
                    positive
                  />
                )}

                <div className="flex justify-between items-end pt-5 border-t border-slate-200">
                  <span className="text-lg font-semibold text-slate-900">
                    Total a pagar
                  </span>
                  <span className="text-4xl font-bold text-[#1e3a8a]">
                    ${total} MXN
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              {total > 0 && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    items={items}
                    total={total}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              ) : (
                <div className="text-center py-10">
                  <p className="text-3xl mb-3">🪙</p>
                  <p className="font-semibold text-[#1e3a8a]">
                    Selecciona tus coins
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Elige compra individual o un paquete para continuar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SaldoCard({ label, value }) {
  return (
    <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50 text-[#1e3a8a]">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function CoinSelector({ title, description, price, qty, setQty }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <p className="font-bold text-xl text-[#1e3a8a]">{title}</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {description}
          </p>
          <p className="text-slate-900 font-bold mt-3">
            ${price} MXN{" "}
            <span className="text-xs font-semibold text-slate-500">c/u</span>
          </p>
        </div>

        <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white w-fit">
          <button
            type="button"
            onClick={() => setQty(Math.max(0, qty - 1))}
            className="w-12 h-11 text-xl text-[#1e3a8a] hover:bg-blue-50"
          >
            –
          </button>

          <span className="w-12 text-center font-bold text-slate-900">
            {qty}
          </span>

          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-12 h-11 text-xl text-[#1e3a8a] hover:bg-blue-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function PaqueteCard({ title, description, specs, price, setQty }) {
  const subtotal = price * PAQUETE_10;
  const total = Math.round(subtotal * 0.9);

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-bold text-xl">{title}</p>
            <span className="text-xs border border-blue-200 text-blue-50 rounded-full px-2 py-1">
              10% off
            </span>
          </div>

          <p className="text-sm text-blue-50 mt-2">{description}</p>
          <p className="text-xs text-blue-100 mt-2 max-w-sm">{specs}</p>

          <div className="flex items-end gap-3 mt-4">
            <span className="text-blue-200 line-through">${subtotal} MXN</span>
            <span className="text-2xl font-bold">${total} MXN</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setQty((prev) => prev + PAQUETE_10)}
          className="bg-white text-[#1e40af] hover:bg-slate-100 font-semibold rounded-xl px-5 py-3 min-w-36"
        >
          Agregar 10
        </button>
      </div>
    </div>
  );
}

function ResumenRow({ label, value, positive }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-semibold ${
          positive ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}