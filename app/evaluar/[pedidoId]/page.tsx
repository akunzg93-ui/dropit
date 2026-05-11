"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EvaluarPage() {
  const params = useParams();

  const [pedido, setPedido] = useState<any>(null);
  const [ratingVendedor, setRatingVendedor] = useState(0);
  const [ratingEstablecimiento, setRatingEstablecimiento] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPedido();
  }, []);

  async function loadPedido() {
    try {
      console.log("CARGANDO PEDIDO:", params.pedidoId);

      const res = await fetch("/api/orders/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: Number(params.pedidoId),
        }),
      });

      const text = await res.text();
      console.log("RAW RESPONSE:", text);

      const data = JSON.parse(text);
      console.log("RESPUESTA API:", data);

      if (!data || !data.id) {
        throw new Error("Pedido inválido");
      }

      setPedido(data);

    } catch (err) {
      console.error("ERROR LOAD:", err);
      setError("Error cargando pedido");
    }
  }

  async function enviarEvaluacion() {
  if (!pedido || success || loading) return; // 🔥 AQUÍ

    if (ratingVendedor === 0 || ratingEstablecimiento === 0) {
    setError("Selecciona una calificación");
    return;
  }

    setLoading(true);
    setError("");

    try {
      console.log("ENVIANDO EVALUACIONES...");

      // 👉 vendedor
      const resVendedor = await fetch("/api/orders/evaluaciones/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({
          pedido_id: pedido.id,
          evaluador_id: self.crypto.randomUUID(),// 👈 comprador público (luego lo refinamos)
          evaluado_id: pedido.vendedor_id,
          rating: ratingVendedor,
          comentario,
          tipo_evaluador: "comprador",
          tipo_evaluado: "vendedor",
        }),
      });
      

      console.log("VENDEDOR STATUS:", resVendedor.status);

      // 👉 establecimiento

      console.log("PAYLOAD EST:", {
  pedido_id: pedido.id,
  evaluado_id: pedido.establecimiento_uuid,
  rating: ratingEstablecimiento,
});
      const resEstablecimiento = await fetch(
        "/api/orders/evaluaciones/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pedido_id: pedido.id,
            evaluador_id: self.crypto.randomUUID(), 
            evaluado_id: pedido.establecimiento_uuid,
            rating: ratingEstablecimiento,
            comentario,
            tipo_evaluador: "comprador",
            tipo_evaluado: "establecimiento",
          }),
        }
      );

       if (!resEstablecimiento.ok) {
  const errData = await resEstablecimiento.json(); // ✅
  console.error("🔥 ERROR BACK COMPLETO:", errData);
  throw new Error(errData.detail || "Error en evaluación");
}

      console.log("ESTABLECIMIENTO STATUS:", resEstablecimiento.status);

      if (!resVendedor.ok || !resEstablecimiento.ok) {
        throw new Error("Error en alguna evaluación");
      }

      setSuccess(true);

    } catch (err) {
      console.error("❌ ERROR:", err);
      setError("Error enviando evaluación");
    } finally {
      setLoading(false);
    }
  }

  const renderStars = (value: number, setValue: any) => (
    <div className="flex justify-center gap-2 mb-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => setValue(n)}
          className={`text-2xl cursor-pointer transition ${
            n <= value ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="text-center mt-20 text-red-500">{error}</div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center mt-20">Cargando...</div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      
      {/* HEADER DROPIT */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-center py-6 rounded-2xl shadow mb-6">
        <h1 className="text-xl font-semibold">
          ¿Cómo fue tu experiencia?
        </h1>
        <p className="text-sm opacity-80">
          Pedido {pedido.folio}
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        
        {/* VENDEDOR */}
        <p className="text-center font-medium">Vendedor</p>
        {renderStars(ratingVendedor, setRatingVendedor)}

        {/* ESTABLECIMIENTO */}
        <p className="text-center font-medium mt-4">
          Establecimiento
        </p>
        {renderStars(
          ratingEstablecimiento,
          setRatingEstablecimiento
        )}

        {/* COMENTARIO */}
        <textarea
          className="w-full border rounded-xl p-3 mt-4"
          placeholder="Cuéntanos tu experiencia..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        {/* BOTÓN */}
        <button
          onClick={enviarEvaluacion}
          disabled={success || loading}
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-xl font-medium"
        >
          {loading ? "Enviando..." : "Enviar evaluación"}
        </button>

        {error && (
          <p className="text-red-500 text-center mt-2">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-center mt-2">
            ✅ Evaluación enviada
          </p>
        )}
      </div>
    </div>
  );
}