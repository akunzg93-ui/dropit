"use client";

import { useEffect, useState } from "react";

interface Props {
  evaluado_id: string;
  tipo: "vendedor" | "establecimiento";
}

export default function StarsPromedio({
  evaluado_id,
  tipo,
}: Props) {
  const [promedio, setPromedio] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/orders/reviews/promedio?evaluado_id=${evaluado_id}&tipo=${tipo}`
        );

        // 🔥 evitar crash si no viene JSON
        if (!res.ok) {
          throw new Error("Error obteniendo promedio");
        }

        const text = await res.text();

        // 🔥 respuesta vacía
        if (!text) {
          setPromedio(0);
          setTotal(0);
          return;
        }

        const data = JSON.parse(text);

        setPromedio(data.promedio || 0);
        setTotal(data.total || 0);

      } catch (err) {
        console.error("Error cargando promedio:", err);

        // fallback visual seguro
        setPromedio(0);
        setTotal(0);

      } finally {
        setLoading(false);
      }
    }

    if (evaluado_id) {
      load();
    }
  }, [evaluado_id, tipo]);

  // 🎨 estilos según contexto
  const emptyStarColor =
    tipo === "vendedor"
      ? "text-white/40"
      : "text-slate-300";

  const textColor =
    tipo === "vendedor"
      ? "text-slate-100"
      : "text-slate-600";

  // ⭐ render estrellas
  const renderStars = () => {
    const full = Math.floor(promedio);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`text-lg transition-colors ${
              n <= full
                ? "text-yellow-400"
                : emptyStarColor
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-400">
        Cargando...
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {renderStars()}

      <span className={`text-sm ${textColor}`}>
        {promedio} • {total} reseñas
      </span>
    </div>
  );
}