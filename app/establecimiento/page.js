"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabaseClient";
import {
  geocodificarDireccion,
  autocompletarDireccion,
  reverseGeocodificar,
} from "../utils/geocodificar";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Mapa sin SSR
const MapaEstablecimientos = dynamic(
  () => import("../components/MapaEstablecimientos"),
  { ssr: false }
);

// Horarios predefinidos
const HORARIOS = [
  "08:00 – 17:00",
  "09:00 – 18:00",
  "10:00 – 19:00",
  "11:00 – 20:00",
  "12:00 – 21:00",
  "24 horas",
];

// Helper para distancia (Haversine)
function calcularDistanciaKm(p1, p2) {
  if (!p1 || !p2) return null;

  const R = 6371;
  const toRad = (g) => (g * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ✅ Timeout para evitar “se congeló”
function withTimeout(promise, ms, label = "Operación") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} tardó demasiado (${ms}ms)`)), ms)
    ),
  ]);
}

export default function EstablecimientoPage() {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cp, setCp] = useState("");
  const [horario, setHorario] = useState("");

  // ⭐ CAPACIDADES
  const [capSmall, setCapSmall] = useState("");
  const [capMedium, setCapMedium] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // ✅ NUEVO: spinner por fila al eliminar
  const [eliminandoId, setEliminandoId] = useState(null);

  const [establecimientos, setEstablecimientos] = useState([]);

  // ⭐ Identificar si estamos editando
  const [editandoId, setEditandoId] = useState(null);

  // Punto de referencia / ubicación
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Autocomplete
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  // 🔄 Cargar establecimientos
  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from("establecimientos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error cargando establecimientos:", error);
        return;
      }

      setEstablecimientos((data || []).filter((e) => e !== null));
    };

    cargar();
  }, []);

  // 🔍 Autocomplete
  const manejarCambioBusqueda = async (valor) => {
    setBusqueda(valor);
    setSugerencias([]);

    if (!valor || valor.length < 3) return;

    setCargandoSugerencias(true);
    const resultados = await autocompletarDireccion(valor);
    setSugerencias(resultados);
    setCargandoSugerencias(false);
  };

  const seleccionarSugerencia = (sug) => {
    setBusqueda(sug.label);
    setDireccion(sug.label);
    if (sug.cp) setCp(sug.cp);
    setSelectedPoint({ lat: sug.lat, lng: sug.lng });
    setSugerencias([]);
  };

  // 📍 Usar ubicación actual
  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setMensaje("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const punto = { lat: latitude, lng: longitude };
        setSelectedPoint(punto);

        const rev = await reverseGeocodificar(latitude, longitude);

        if (rev) {
          setDireccion(rev.direccion);
          if (rev.cp) setCp(rev.cp);
          setBusqueda(rev.direccion);
        }

        setMensaje("Ubicación detectada.");
      },
      () => setMensaje("No pude obtener tu ubicación.")
    );
  };

  // 🗺 Click en mapa
  const manejarClickMapa = (punto) => {
    setSelectedPoint(punto);
  };

  // 📝 Guardar o actualizar establecimiento (FIX + DEBUG REAL)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!nombre || !direccion || !cp) {
      setMensaje("Por favor llena: nombre, dirección y CP.");
      return;
    }

    if (!capSmall || !capMedium) {
      setMensaje("Debes ingresar capacidad SMALL y MEDIUM.");
      return;
    }

    setCargando(true);

    try {
      console.log("🟦 handleSubmit start");
      console.log("🧾 payload:", { nombre, direccion, cp, horario, capSmall, capMedium });
      console.log("📍 selectedPoint:", selectedPoint);
      console.log("✏️ editandoId:", editandoId);

      // ✅ Usuario autenticado (para usuario_id)
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("❌ auth.getUser error:", authError);
        setMensaje("Error de sesión: " + authError.message);
        return;
      }
      const user = authData?.user;
      if (!user) {
        setMensaje("No hay sesión activa. Vuelve a iniciar sesión.");
        return;
      }
      console.log("👤 user.id:", user.id);

      let coords = selectedPoint;

      if (!coords) {
        const texto = `${direccion}, ${cp}, México`;
        console.log("🧭 Geocodificando:", texto);

        coords = await withTimeout(
          geocodificarDireccion(texto),
          15000,
          "Geocodificación"
        );
      }

      if (!coords) {
        setMensaje("No pude encontrar esa dirección.");
        return;
      }

      console.log("✅ coords:", coords);

      const payload = {
        nombre,
        direccion,
        cp,
        horario,
        lat: coords.lat,
        lng: coords.lng,
        capacidad_small: Number(capSmall),
        capacidad_medium: Number(capMedium),

        // ✅ CLAVE: tu tabla tiene usuario_id y estaba NULL.
        usuario_id: user.id,
      };

      // ⭐ SI ESTAMOS EDITANDO → UPDATE
      if (editandoId) {
        console.log("🟨 UPDATE establecimientos", { id: editandoId, payload });

        const { data, error } = await withTimeout(
          supabase
            .from("establecimientos")
            .update(payload)
            .eq("id", editandoId)
            .select()
            .single(),
          15000,
          "UPDATE Supabase"
        );

        if (error) {
          console.error("❌ Supabase UPDATE error:", error);
          setMensaje("Error al actualizar en Supabase: " + (error.message || "desconocido"));
          return;
        }

        setEstablecimientos((prev) =>
          prev.map((e) => (e.id === editandoId ? data : e))
        );

        setMensaje("✅ Establecimiento actualizado.");
        setEditandoId(null);
      } else {
        // ⭐ INSERTAR NUEVO
        console.log("🟩 INSERT establecimientos", payload);

        const { data, error } = await withTimeout(
          supabase
            .from("establecimientos")
            .insert(payload)
            .select()
            .single(),
          15000,
          "INSERT Supabase"
        );

        if (error) {
          console.error("❌ Supabase INSERT error:", error);
          setMensaje("Error al guardar en Supabase: " + (error.message || "desconocido"));
          return;
        }

        setEstablecimientos((prev) => [data, ...prev]);
        setMensaje("✅ Establecimiento guardado.");
      }

      // limpiar
      setNombre("");
      setDireccion("");
      setCp("");
      setHorario("");
      setCapSmall("");
      setCapMedium("");
      setSelectedPoint(null);

      console.log("🟦 handleSubmit end ✅");
    } catch (err) {
      console.error("💥 handleSubmit catch:", err);
      setMensaje("Ocurrió un error: " + (err?.message || "desconocido"));
    } finally {
      setCargando(false);
    }
  };

  // ✏️ EDITAR
  const editarEstablecimiento = (est) => {
    setEditandoId(est.id);
    setNombre(est.nombre);
    setDireccion(est.direccion);
    setCp(est.cp);
    setHorario(est.horario || "");
    setCapSmall(est.capacidad_small || "");
    setCapMedium(est.capacidad_medium || "");
    setSelectedPoint({ lat: est.lat, lng: est.lng });

    setMensaje(`Editando: ${est.nombre}`);
  };

  // 🗑️ ELIMINAR (con spinner por fila)
  const eliminarEstablecimiento = async (id) => {
    if (eliminandoId) return; // evita doble click mientras elimina algo
    setEliminandoId(id);
    setMensaje("");

    try {
      console.log("🗑️ Intentando borrar id:", id);

      const { data, error } = await supabase
        .from("establecimientos")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("❌ delete error:", error);
        setMensaje("Error al eliminar: " + error.message);
        return;
      }

      console.log("🧾 Filas eliminadas:", data);

      if (!data || data.length === 0) {
        setMensaje("⚠️ No se eliminó nada en Supabase.");
        return;
      }

      setEstablecimientos((prev) => prev.filter((e) => e.id !== id));
      setMensaje("Eliminado correctamente ✅");
    } finally {
      setEliminandoId(null);
    }
  };

  // 📏 Ordenar por distancia
  const establecimientosOrdenados = [...establecimientos]
    .map((est) => {
      const distanciaKm = selectedPoint
        ? calcularDistanciaKm(selectedPoint, { lat: est.lat, lng: est.lng })
        : null;
      return { ...est, distanciaKm };
    })
    .sort((a, b) => {
      if (a.distanciaKm == null && b.distanciaKm == null) return 0;
      if (a.distanciaKm == null) return 1;
      if (b.distanciaKm == null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Establecimiento – Registro (estilo Uber)</h1>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
        {/* AUTOCOMPLETE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Buscar dirección (autocomplete Mapbox)
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Ej. Calle, colonia, ciudad..."
                value={busqueda}
                onChange={(e) => manejarCambioBusqueda(e.target.value)}
              />

              {cargandoSugerencias && (
                <div className="absolute right-2 top-2 text-xs text-gray-400">...</div>
              )}

              {sugerencias.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow text-sm max-h-48 overflow-auto">
                  {sugerencias.map((sug) => (
                    <li
                      key={sug.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => seleccionarSugerencia(sug)}
                    >
                      {sug.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={usarUbicacionActual}
              className="px-3 py-2 text-xs sm:text-sm rounded bg-gray-800 text-white hover:bg-black whitespace-nowrap"
            >
              Usar mi ubicación
            </button>
          </div>
        </div>

        {/* CAMPOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del establecimiento</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Código Postal</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={cp}
              onChange={(e) => setCp(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección (puedes ajustar texto)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>

        {/* ⭐ HORARIO (SELECT) */}
        <div>
          <label className="block text-sm font-medium mb-1">Horario (opcional)</label>

          <Select value={horario} onValueChange={setHorario}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un horario" />
            </SelectTrigger>
            <SelectContent>
              {HORARIOS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ⭐ CAPACIDADES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Capacidad SMALL (máx. paquetes simultáneos)
            </label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={capSmall}
              onChange={(e) => setCapSmall(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Capacidad MEDIUM (máx. paquetes simultáneos)
            </label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={capMedium}
              onChange={(e) => setCapMedium(e.target.value)}
            />
          </div>
        </div>

        {/* BOTÓN (con spinner) */}
        <button
          type="submit"
          disabled={cargando}
          className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {cargando && (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}

          <span>
            {cargando
              ? "Guardando..."
              : editandoId
              ? "Actualizar establecimiento"
              : "Guardar establecimiento"}
          </span>
        </button>
      </form>

      {mensaje && <p className="text-sm text-gray-800">{mensaje}</p>}

      {/* MAPA */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Mapa – selecciona o ajusta el punto</h2>

        <div className="h-80 rounded-lg overflow-hidden shadow">
          <MapaEstablecimientos
            establecimientos={establecimientos}
            selectedPoint={selectedPoint}
            onLocationSelected={manejarClickMapa}
          />
        </div>
      </div>

      {/* TABLA */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Establecimientos registrados</h2>

        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Dirección</th>
                <th className="px-4 py-2">CP</th>
                <th className="px-4 py-2">Horario</th>
                <th className="px-4 py-2">Cap. SMALL</th>
                <th className="px-4 py-2">Cap. MEDIUM</th>
                <th className="px-4 py-2">Distancia (km)</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {establecimientosOrdenados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No hay establecimientos registrados aún.
                  </td>
                </tr>
              )}

              {establecimientosOrdenados.map((est) => (
                <tr key={est.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{est.nombre}</td>
                  <td className="px-4 py-2">{est.direccion}</td>
                  <td className="px-4 py-2">{est.cp}</td>
                  <td className="px-4 py-2">{est.horario || "—"}</td>
                  <td className="px-4 py-2">{est.capacidad_small ?? "—"}</td>
                  <td className="px-4 py-2">{est.capacidad_medium ?? "—"}</td>
                  <td className="px-4 py-2">
                    {est.distanciaKm != null ? est.distanciaKm.toFixed(2) : "—"}
                  </td>

                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => editarEstablecimiento(est)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                    >
                      Editar
                    </button>

                    {/* ELIMINAR (con spinner por fila) */}
                    <button
                      onClick={() => eliminarEstablecimiento(est.id)}
                      disabled={eliminandoId === est.id}
                      className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {eliminandoId === est.id && (
                        <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      )}
                      {eliminandoId === est.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
