"use client";

import { useEffect, useRef, useState } from "react";
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

const MapaEstablecimientos = dynamic(
  () => import("../components/MapaEstablecimientos"),
  { ssr: false }
);

const HORARIOS = [
  "08:00 – 17:00",
  "09:00 – 18:00",
  "10:00 – 19:00",
  "11:00 – 20:00",
  "12:00 – 21:00",
  "24 horas",
];

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

  const [capSmall, setCapSmall] = useState("");
  const [capMedium, setCapMedium] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [establecimientos, setEstablecimientos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const formRef = useRef(null);

  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  const establecimientoEditando = establecimientos.find(
    (e) => e.id === editandoId
  );

  function limpiarFormulario() {
    setNombre("");
    setDireccion("");
    setCp("");
    setHorario("");
    setHoraApertura("");
    setHoraCierre("");
    setCapSmall("");
    setCapMedium("");
    setSelectedPoint(null);
    setBusqueda("");
    setSugerencias([]);
    setInstruccionesLlegada("");
    setGoogleMapsUrl("");
    setZona("");
    setEditandoId(null);
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setMensaje("Edición cancelada.");
  }

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

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

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

  const manejarClickMapa = (punto) => {
    setSelectedPoint(punto);
  };

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
          setMensaje(
            "Error al actualizar en Supabase: " +
              (error.message || "desconocido")
          );
          return;
        }

        setEstablecimientos((prev) =>
          prev.map((e) => (e.id === editandoId ? data : e))
        );

        setMensaje("✅ Establecimiento actualizado.");
        limpiarFormulario();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        const { data, error } = await withTimeout(
          supabase.from("establecimientos").insert(payload).select().single(),
          15000,
          "INSERT Supabase"
        );

        if (error) {
          setMensaje(
            "Error al guardar en Supabase: " +
              (error.message || "desconocido")
          );
          return;
        }

        setEstablecimientos((prev) => [data, ...prev]);
        setMensaje("✅ Establecimiento guardado.");
        limpiarFormulario();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (err) {
      setMensaje("Ocurrió un error: " + (err?.message || "desconocido"));
    } finally {
      setCargando(false);
    }
  };

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
    setBusqueda(est.direccion || "");
    setMensaje("");

    setTimeout(() => {
      if (!formRef.current) return;

      const y =
        formRef.current.getBoundingClientRect().top + window.pageYOffset - 80;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }, 100);
  };

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
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
              Logística fácil y sin dramas
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mt-3 leading-tight">
              Registro de establecimientos <span className="inline-block">🏪</span>
            </h1>

            <p className="text-slate-600 mt-4 max-w-2xl text-lg">
              Configura tus ubicaciones, horarios y capacidades para recibir
              paquetes en Dropit.
            </p>
          </div>
        </section>

        {mensaje && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              mensaje.startsWith("✅")
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : mensaje.includes("⚠️")
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            {mensaje}
          </div>
        )}

        <section
          ref={formRef}
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Paso 1
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
              Información del establecimiento
            </h2>

            <p className="text-slate-500 mt-2">
              Agrega los datos necesarios para que los vendedores y clientes
              identifiquen correctamente esta ubicación.
            </p>
          </div>

          {editandoId && (
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-semibold">
                    Modo edición
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a8a] mt-1">
                    ✏️ Editando establecimiento
                  </h3>

                  <p className="text-sm text-slate-600 mt-1">
                    Estás modificando{" "}
                    <span className="font-semibold text-slate-900">
                      {establecimientoEditando?.nombre || nombre}
                    </span>
                    . Guarda los cambios cuando termines.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar edición
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Buscar dirección
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    placeholder="Ej. Calle, colonia..."
                    value={busqueda}
                    onChange={(e) => manejarCambioBusqueda(e.target.value)}
                  />

                  {cargandoSugerencias && (
                    <div className="absolute right-3 top-4 text-xs text-slate-400">
                      ...
                    </div>
                  )}

                  {sugerencias.length > 0 && (
                    <ul className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg text-sm max-h-48 overflow-auto">
                      {sugerencias.map((sug) => (
                        <li
                          key={sug.id}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer"
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
                  className="h-12 rounded-xl bg-slate-900 px-5 text-white text-sm font-semibold hover:bg-black transition"
                >
                  Usar ubicación
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputDropit label="Nombre" value={nombre} onChange={setNombre} />

              <InputDropit
                label="Código Postal"
                value={cp}
                onChange={setCp}
              />
            </div>

            <InputDropit
              label="Dirección"
              value={direccion}
              onChange={setDireccion}
            />

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Cómo llegar al establecimiento
              </label>

              <textarea
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:ring-2 focus:ring-blue-100 focus:outline-none"
                placeholder="Ej: Dentro de Plaza San Ángel..."
                rows={3}
                value={instruccionesLlegada}
                onChange={(e) => setInstruccionesLlegada(e.target.value)}
              />
            </div>

            <InputDropit
              label="Link de Google Maps"
              value={googleMapsUrl}
              onChange={setGoogleMapsUrl}
              placeholder="https://maps.google.com/..."
              helper="Puedes pegar un link de Google Maps para abrir la ruta directamente."
            />

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Zona
              </label>

              <Select value={zona} onValueChange={setZona}>
                <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>

                <SelectContent className="z-[9999]">
                  <SelectItem value="Norte">Norte</SelectItem>
                  <SelectItem value="Sur">Sur</SelectItem>
                  <SelectItem value="Oriente">Oriente</SelectItem>
                  <SelectItem value="Poniente">Poniente</SelectItem>
                  <SelectItem value="Centro">Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Horario
              </label>

              <Select value={horario} onValueChange={setHorario}>
                <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Selecciona un horario" />
                </SelectTrigger>

                <SelectContent className="z-[9999]">
                  {HORARIOS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}

                  <SelectItem value="custom">Horario personalizado</SelectItem>
                </SelectContent>
              </Select>

              {horario === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <InputDropit
                    label="Apertura"
                    type="time"
                    value={horaApertura}
                    onChange={setHoraApertura}
                  />

                  <InputDropit
                    label="Cierre"
                    type="time"
                    value={horaCierre}
                    onChange={setHoraCierre}
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-blue-100 bg-slate-50 p-5 text-sm text-slate-600 space-y-1">
              <p className="font-bold text-[#1e3a8a]">Tipos de paquete</p>
              <p>Paquete pequeño: hasta 3 kg · máx 40 cm por lado</p>
              <p>Paquete mediano: hasta 10 kg · máx 70 cm por lado</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputDropit
                label="Capacidad paquetes pequeños"
                type="number"
                value={capSmall}
                onChange={setCapSmall}
              />

              <InputDropit
                label="Capacidad paquetes medianos"
                type="number"
                value={capMedium}
                onChange={setCapMedium}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cargando && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}

              {editandoId ? "Actualizar establecimiento" : "Guardar establecimiento"}
            </button>
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Paso 2
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
                Ubicación del establecimiento
              </h2>

              <p className="text-slate-500 mt-2">
                Selecciona o ajusta el punto exacto donde se recibirá el paquete.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 md:text-right">
              {selectedPoint ? (
                <div>
                  <div className="font-semibold text-slate-700">
                    Punto seleccionado
                  </div>
                  <div>
                    {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                  </div>
                </div>
              ) : (
                <div>Sin punto seleccionado</div>
              )}
            </div>
          </div>

          <div className="relative z-0 h-[320px] md:h-96 w-full rounded-3xl overflow-hidden border border-blue-100 shadow-sm ring-1 ring-blue-50">
            <MapaEstablecimientos
              establecimientos={establecimientos}
              selectedPoint={selectedPoint}
              onLocationSelected={manejarClickMapa}
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Paso 3
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
              Tus establecimientos
            </h2>

            <p className="text-slate-500 mt-2">
              Administra las ubicaciones donde recibirás paquetes.
            </p>
          </div>

          <div className="md:hidden space-y-4">
            {establecimientosOrdenados.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-6">
                No hay establecimientos registrados aún.
              </div>
            )}

            {establecimientosOrdenados.map((est) => (
              <div
                key={est.id}
                className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{est.nombre}</h3>

                  <p className="text-sm text-slate-500 mt-1">{est.direccion}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoMini label="Código postal" value={est.cp} />
                  <InfoMini label="Horario" value={est.horario || "—"} />
                  <InfoMini label="Zona" value={est.zona || "—"} />
                  <InfoMini
                    label="Distancia"
                    value={
                      est.distanciaKm != null
                        ? `${est.distanciaKm.toFixed(2)} km`
                        : "—"
                    }
                  />
                  <InfoMini label="Pequeño" value={est.capacidad_small ?? "—"} />
                  <InfoMini label="Mediano" value={est.capacidad_medium ?? "—"} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editarEstablecimiento(est)}
                    className="flex-1 h-11 rounded-xl bg-[#2563eb] text-white text-sm font-semibold shadow-sm"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => eliminarEstablecimiento(est.id)}
                    disabled={eliminandoId === est.id}
                    className="flex-1 h-11 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-60"
                  >
                    {eliminandoId === est.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
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
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No hay establecimientos registrados aún.
                    </td>
                  </tr>
                )}

                {establecimientosOrdenados.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 font-semibold text-slate-800">
                      {est.nombre}
                    </td>

                    <td className="text-slate-700 max-w-xs">{est.direccion}</td>
                    <td className="text-slate-700">{est.cp}</td>
                    <td className="text-slate-700">{est.horario || "—"}</td>
                    <td className="text-slate-700">{est.zona || "—"}</td>

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

                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarEstablecimiento(est)}
                          className="px-3 py-2 text-xs bg-[#2563eb] text-white rounded-xl hover:bg-[#1e40af] transition shadow-sm"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => eliminarEstablecimiento(est.id)}
                          disabled={eliminandoId === est.id}
                          className="px-3 py-2 text-xs bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {eliminandoId === est.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function InputDropit({
  label,
  value,
  onChange,
  placeholder = "",
  helper = "",
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700">
        {label}
      </label>

      <input
        type={type}
        className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 focus:ring-2 focus:ring-blue-100 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
    </div>
  );
}

function InfoMini({ label, value }) {
  return (
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}