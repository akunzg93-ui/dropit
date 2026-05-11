"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EvaluarVendedorPage() {
  const { pedidoId } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [ratingVendedor, setRatingVendedor] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);

  // 🔥 cargar pedido
  useEffect(() => {
    async function loadPedido() {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, folio, vendedor_id")
        .eq("id", pedidoId)
        .single();

      if (!error) setPedido(data);
    }

    if (pedidoId) loadPedido();
  }, [pedidoId]);

  // 🔥 cargar usuario
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }

    getUser();
  }, []);

  // 🔥 validar si ya evaluó
  useEffect(() => {
    async function checkEvaluacion() {
      if (!pedido || !user) return;

      const { data } = await supabase
        .from("evaluaciones")
        .select("id")
        .eq("pedido_id", pedido.id)
        .eq("evaluador_id", user.id)
        .eq("tipo_evaluado", "vendedor")
        .maybeSingle();

      if (data) {
        console.log("YA EVALUADO");

        setAlreadyEvaluated(true);

        // 🔥 redirect automático
        setTimeout(() => {
          router.push("/establecimiento/estado");
        }, 1500);
      }
    }

    checkEvaluacion();
  }, [pedido, user]);

  // 🔥 enviar evaluación
  async function enviarEvaluacion() {
    if (!pedido || !user || success || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders/evaluaciones/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: Number(pedido.id),
          evaluador_id: user.id,
          evaluado_id: pedido.vendedor_id,
          rating: ratingVendedor,
          comentario: comentario || null,
          tipo_evaluador: "establecimiento",
          tipo_evaluado: "vendedor",
        }),
      });

      if (!res.ok) throw new Error();

      setSuccess(true);

      // 🔥 redirect después de enviar
      setTimeout(() => {
        router.push("/establecimiento/estado");
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Error enviando evaluación");
    } finally {
      setLoading(false);
    }
  }

  // ⭐ estrellas
  const renderStars = (value: number, setter: any) => (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => setter(n)}
          className={`text-2xl cursor-pointer ${
            n <= value ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );

  // 🛑 BLOQUEO TOTAL DE PANTALLA
  if (alreadyEvaluated) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-500">
          Ya evaluaste este pedido. Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl p-6 text-center shadow-md">
        <h1 className="text-2xl font-bold">¿Cómo fue tu experiencia?</h1>
        {pedido && (
          <p className="text-sm opacity-80 mt-1">
            Pedido {pedido.folio}
          </p>
        )}
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6">

        {!pedido && !error && (
          <p className="text-center text-gray-500">Cargando...</p>
        )}

        {pedido && (
          <>
            <div className="text-center mb-4">
              <p className="font-medium mb-1">Vendedor</p>
              {renderStars(ratingVendedor, setRatingVendedor)}
            </div>

            <textarea
              className="w-full border rounded-lg p-3 mt-4"
              placeholder="Cuéntanos tu experiencia..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />

            <button
              onClick={enviarEvaluacion}
              disabled={loading || success}
              className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Enviando..." : success ? "Enviado" : "Enviar evaluación"}
            </button>
          </>
        )}

        {error && (
          <p className="text-red-500 mt-4 text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-600 mt-4 text-center">
            ✅ Evaluación enviada
          </p>
        )}
      </div>
    </div>
  );
}