"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
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
  const [instruccionesLlegada, setInstruccionesLlegada] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [zona, setZona] = useState("");

  const [horaApertura, setHoraApertura] = useState("");
const [horaCierre, setHoraCierre] = useState("");

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
 // 🔄 Cargar establecimientos
useEffect(() => {
  const cargar = async () => {

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("establecimientos")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error cargando establecimientos:", error);
      return;
    }

    setEstablecimientos((data || []).filter((e) => e !== null));
  };

  cargar();
}, []);

useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      setCargando(false);
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibility
  );

  return () => {
    document.removeEventListener(
      "visibilitychange",
      handleVisibility
    );
  };
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

    const punto = {
      lat: latitude,
      lng: longitude,
    };

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

  // 📝 Guardar o actualizar establecimiento (NO TOCAR LÓGICA)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!nombre || !direccion || !cp) {
      setMensaje("Por favor llena: nombre, dirección y CP.");
      return;
    }

    if (!capSmall || !capMedium) {
      setMensaje("Debes ingresar capacidad para paquete pequeño y mediano.");
      return;
    }

    setCargando(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setMensaje("Error de sesión: " + authError.message);
        return;
      }
      const user = authData?.user;
      if (!user) {
        setMensaje("No hay sesión activa. Vuelve a iniciar sesión.");
        return;
      }

      let coords = selectedPoint;

      if (!coords) {
        const texto = `${direccion}, ${cp}, México`;
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

let horarioFinal = horario;

if (horario === "custom" && horaApertura && horaCierre) {
  horarioFinal = `${horaApertura} – ${horaCierre}`;
}

      const payload = {
        nombre,
        direccion,
        cp,
        horario: horarioFinal,
        lat: coords.lat,
        lng: coords.lng,
        capacidad_small: Number(capSmall),
        capacidad_medium: Number(capMedium),
        usuario_id: user.id,
        instrucciones_llegada: instruccionesLlegada,
        google_maps_url: googleMapsUrl,
        zona,
      };

      if (editandoId) {
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
          setMensaje("Error al actualizar en Supabase: " + (error.message || "desconocido"));
          return;
        }

        setEstablecimientos((prev) =>
          prev.map((e) => (e.id === editandoId ? data : e))
        );

        setMensaje("✅ Establecimiento actualizado.");
setEditandoId(null);

window.scrollTo({
  top: 0,
  behavior: "smooth",
});
      } else {
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
          setMensaje("Error al guardar en Supabase: " + (error.message || "desconocido"));
          return;
        }

        setEstablecimientos((prev) => [data, ...prev]);
setMensaje("✅ Establecimiento guardado.");

window.scrollTo({
  top: 0,
  behavior: "smooth",
});
      }

      setNombre("");
      setDireccion("");
      setCp("");
      setHorario("");
      setCapSmall("");
      setCapMedium("");
      setSelectedPoint(null);
      setBusqueda("");
      setSugerencias([]);
      setInstruccionesLlegada("");
      setGoogleMapsUrl("");
      setZona("");
    } catch (err) {
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
    setInstruccionesLlegada(est.instrucciones_llegada || "");
    setGoogleMapsUrl(est.google_maps_url || "");
    setZona(est.zona || "");
    setMensaje(`Editando: ${est.nombre}`);
  };

  // 🗑️ ELIMINAR (NO TOCAR LÓGICA)
  const eliminarEstablecimiento = async (id) => {
    if (eliminandoId) return;
    setEliminandoId(id);
    setMensaje("");

    try {
      const { data, error } = await supabase
        .from("establecimientos")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        setMensaje("Error al eliminar: " + error.message);
        return;
      }

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

  // -------------------------
  // UI PREMIUM (CON MAPA)
  // -------------------------
  return (
  <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-10">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-[28px] p-5 md:p-8 shadow-xl space-y-3">

        <div className="flex items-center justify-between text-sm opacity-90">
          <span>Proceso operativo</span>
          <span>Registro de establecimiento</span>
        </div>

        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-white rounded-full transition-all"></div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          Registro de establecimientos
        </h1>

        <p className="text-white/90 text-sm md:text-base">
          Configura ubicaciones, horarios y capacidades de recepción.
        </p>
      </div>

      {/* MENSAJE */}
      {mensaje && (
        <div
          className={`rounded-2xl border p-4 text-sm shadow-sm ${
            mensaje.includes("✅")
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : mensaje.includes("⚠️")
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-5 md:p-8 space-y-5"
      >

        <h2 className="text-2xl font-semibold text-slate-800">
          Datos del establecimiento
        </h2>

        {/* AUTOCOMPLETE */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Buscar dirección
          </label>

          <div className="flex flex-col sm:flex-row gap-3">

            <div className="relative flex-1">

              <input
                className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                placeholder="Ej. Calle, colonia..."
                value={busqueda}
                onChange={(e) =>
                  manejarCambioBusqueda(e.target.value)
                }
              />

              {cargandoSugerencias && (
                <div className="absolute right-3 top-3 text-xs text-slate-400">
                  ...
                </div>
              )}

              {sugerencias.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full bg-white border rounded-2xl shadow-lg text-sm max-h-48 overflow-auto">

                  {sugerencias.map((sug) => (
                    <li
                      key={sug.id}
                      className="px-4 py-3 hover:bg-indigo-50 cursor-pointer"
                      onClick={() =>
                        seleccionarSugerencia(sug)
                      }
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
              className="
                px-4
                py-3.5
                rounded-2xl
                bg-slate-800
                text-white
                text-sm
                font-medium
                hover:bg-black
                transition
                whitespace-nowrap
              "
            >
              Usar ubicación
            </button>

          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Nombre
            </label>

            <input
              className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Código Postal
            </label>

            <input
              className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={cp}
              onChange={(e) => setCp(e.target.value)}
            />
          </div>

        </div>

        {/* DIRECCIÓN */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Dirección
          </label>

          <input
            className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>

        {/* INSTRUCCIONES */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Cómo llegar al establecimiento
          </label>

          <textarea
            className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Ej: Dentro de Plaza San Ángel..."
            rows={3}
            value={instruccionesLlegada}
            onChange={(e) =>
              setInstruccionesLlegada(e.target.value)
            }
          />
        </div>

        {/* GOOGLE MAPS */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Link de Google Maps
          </label>

          <input
            className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="https://maps.google.com/..."
            value={googleMapsUrl}
            onChange={(e) =>
              setGoogleMapsUrl(e.target.value)
            }
          />

          <p className="text-xs text-slate-500 mt-2">
            Puedes pegar un link de Google Maps para abrir la ruta directamente.
          </p>
        </div>

        {/* ZONA */}
<div>
  <label className="block text-sm font-medium mb-2 text-slate-700">
    Zona 
  </label>

  <Select
    value={zona}
    onValueChange={setZona}
  >
    <SelectTrigger className="rounded-2xl border-slate-300 h-12">
      <SelectValue placeholder="Selecciona una zona" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="Norte">Norte</SelectItem>
      <SelectItem value="Sur">Sur</SelectItem>
      <SelectItem value="Oriente">Oriente</SelectItem>
      <SelectItem value="Poniente">Poniente</SelectItem>
      <SelectItem value="Centro">Centro</SelectItem>
    </SelectContent>
  </Select>
</div>

        {/* HORARIO */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Horario
          </label>

          <Select
            value={horario}
            onValueChange={setHorario}
          >
            <SelectTrigger className="rounded-2xl border-slate-300 h-12">
              <SelectValue placeholder="Selecciona un horario" />
            </SelectTrigger>

            <SelectContent>

              {HORARIOS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}

              <SelectItem value="custom">
                Horario personalizado
              </SelectItem>

            </SelectContent>
          </Select>

          {horario === "custom" && (
            <div className="grid grid-cols-2 gap-4 mt-4">

              <div>
                <label className="text-xs text-slate-500">
                  Apertura
                </label>

                <input
                  type="time"
                  value={horaApertura}
                  onChange={(e) =>
                    setHoraApertura(e.target.value)
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Cierre
                </label>

                <input
                  type="time"
                  value={horaCierre}
                  onChange={(e) =>
                    setHoraCierre(e.target.value)
                  }
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-sm"
                />
              </div>

            </div>
          )}

        </div>

        {/* TIPOS */}
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-4 text-sm text-slate-600 space-y-1">
          <p className="font-medium text-slate-800">
            Tipos de paquete
          </p>

          <p>
            Paquete pequeño: hasta 3 kg · máx 40 cm por lado
          </p>

          <p>
            Paquete mediano: hasta 10 kg · máx 70 cm por lado
          </p>
        </div>

        {/* CAPACIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Capacidad paquetes pequeños
            </label>

            <input
              type="number"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={capSmall}
              onChange={(e) =>
                setCapSmall(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Capacidad paquete mediano
            </label>

            <input
              type="number"
              className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={capMedium}
              onChange={(e) =>
                setCapMedium(e.target.value)
              }
            />
          </div>

        </div>

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={cargando}
          className="
            w-full
            py-4
            rounded-[24px]
            text-white
            font-semibold
            text-lg
            bg-gradient-to-r
            from-indigo-600
            to-blue-600
            hover:scale-[1.01]
            transition-all
            shadow-lg
            disabled:opacity-50
            disabled:cursor-not-allowed
            flex
            items-center
            justify-center
            gap-2
          "
        >
          {cargando && (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}

          {editandoId
            ? "Actualizar establecimiento"
            : "Guardar establecimiento"}
        </button>

      </form>

      {/* MAPA */}
      <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-5 md:p-8 space-y-4">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              Mapa
            </h2>

            <p className="text-sm text-slate-600">
              Selecciona o ajusta el punto del establecimiento.
            </p>
          </div>

          <div className="text-xs text-slate-500 md:text-right">

            {selectedPoint ? (
              <div>
                <div className="font-medium text-slate-700">
                  Punto seleccionado
                </div>

                <div>
                  {selectedPoint.lat.toFixed(5)},{" "}
                  {selectedPoint.lng.toFixed(5)}
                </div>
              </div>
            ) : (
              <div>Sin punto seleccionado</div>
            )}

          </div>
        </div>

        <div className="rounded-[24px] overflow-hidden border border-slate-200 shadow-sm">

  <div className="h-[320px] md:h-96 relative">

    <div className="h-full w-full">
      <MapaEstablecimientos
        establecimientos={establecimientos}
        selectedPoint={selectedPoint}
        onLocationSelected={manejarClickMapa}
      />
    </div>

  </div>

</div>

        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">

        <h2 className="text-2xl font-semibold text-slate-800">
          Establecimientos registrados
        </h2>

        {establecimientosOrdenados.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-6">
            No hay establecimientos registrados aún.
          </div>
        )}

        {establecimientosOrdenados.map((est) => (
          <div
            key={est.id}
            className="
              border
              border-slate-200
              rounded-[24px]
              p-4
              bg-white
              shadow-sm
              space-y-4
            "
          >

            <div>
              <h3 className="font-semibold text-slate-800">
                {est.nombre}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {est.direccion}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">

              <div>
                <p className="text-slate-400 text-xs">
                  Código postal
                </p>

                <p className="font-medium">
                  {est.cp}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">
                  Horario
                </p>

                <p className="font-medium">
                  {est.horario || "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">
                  Pequeño
                </p>

                <p className="font-medium">
                  {est.capacidad_small ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">
                  Mediano
                </p>

                <p className="font-medium">
                  {est.capacidad_medium ?? "—"}
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() => editarEstablecimiento(est)}
                className="
                  flex-1
                  h-11
                  rounded-2xl
                  bg-indigo-600
                  text-white
                  text-sm
                  font-medium
                "
              >
                Editar
              </button>

              <button
                onClick={() =>
                  eliminarEstablecimiento(est.id)
                }
                disabled={eliminandoId === est.id}
                className="
                  flex-1
                  h-11
                  rounded-2xl
                  bg-slate-200
                  text-slate-700
                  text-sm
                  font-medium
                "
              >
                {eliminandoId === est.id
                  ? "Eliminando..."
                  : "Eliminar"}
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* TABLA DESKTOP */}
      <div className="hidden md:block bg-white rounded-[28px] shadow-xl border border-slate-200 p-8 space-y-6">

        <h2 className="text-xl font-semibold text-slate-800">
          Establecimientos registrados
        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-3">Nombre</th>
                <th className="pb-3">Dirección</th>
                <th className="pb-3">CP</th>
                <th className="pb-3">Horario</th>
                <th className="pb-3">Zona</th>
                <th className="pb-3">Capacidades</th>
                <th className="pb-3">Distancia</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {establecimientosOrdenados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-slate-500"
                  >
                    No hay establecimientos registrados aún.
                  </td>
                </tr>
              )}

              {establecimientosOrdenados.map((est) => (
                <tr
                  key={est.id}
                  className="hover:bg-slate-50 transition"
                >

                  <td className="py-4 font-medium text-slate-800">
                    {est.nombre}
                  </td>

                  <td className="text-slate-700">
                    {est.direccion}
                  </td>

                  <td className="text-slate-700">
                    {est.cp}
                  </td>

                  <td className="text-slate-700">
                    {est.horario || "—"}
                  </td>
                  
                  <td className="text-slate-700">
  {est.zona || "—"}
</td>

                  <td>
                    <div className="text-xs text-slate-600">
                      Pequeño: {est.capacidad_small ?? "—"} <br />
Mediano: {est.capacidad_medium ?? "—"}
                    </div>
                  </td>

                  <td className="text-slate-700">
                    {est.distanciaKm != null
                      ? `${est.distanciaKm.toFixed(2)} km`
                      : "—"}
                  </td>

                  <td className="py-4 flex gap-2">

                    <button
                      onClick={() =>
                        editarEstablecimiento(est)
                      }
                      className="
                        px-3
                        py-1
                        text-xs
                        bg-indigo-600
                        text-white
                        rounded-lg
                        hover:bg-indigo-700
                        transition
                      "
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        eliminarEstablecimiento(est.id)
                      }
                      disabled={eliminandoId === est.id}
                      className="
                        px-3
                        py-1
                        text-xs
                        bg-slate-200
                        rounded-lg
                        hover:bg-slate-300
                        transition
                        disabled:opacity-60
                        disabled:cursor-not-allowed
                        flex
                        items-center
                        gap-2
                      "
                    >
                      {eliminandoId === est.id && (
                        <span className="h-3 w-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                      )}

                      {eliminandoId === est.id
                        ? "Eliminando..."
                        : "Eliminar"}
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