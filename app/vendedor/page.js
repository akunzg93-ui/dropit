"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabaseClient";
import {
  autocompletarDireccion,
  reverseGeocodificar,
} from "../utils/geocodificar";

// Mapa sin SSR
const MapaEstablecimientos = dynamic(
  () => import("../components/MapaEstablecimientos"),
  { ssr: false }
);

// Distancia Haversine
function calcularDistanciaKm(p1, p2) {
  if (!p1 || !p2) return null;

  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function VendedorPage() {
  const [ubicacion, setUbicacion] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSug, setCargandoSug] = useState(false);

  const [establecimientos, setEstablecimientos] = useState([]);

  // ⭐ Lista de establecimientos seleccionados por el vendedor
  const [seleccionados, setSeleccionados] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  // 🔥 Traer usuario actual (asumo que ya tienes auth)
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = supabase.auth.getUser();
    user.then((r) => setUserId(r.data.user?.id || null));
  }, []);

  // 🔄 Cargar establecimientos y selección existente
  useEffect(() => {
    const cargar = async () => {
      const { data: ests } = await supabase
        .from("establecimientos")
        .select("*");

      setEstablecimientos(ests || []);

      if (!userId) return;

      const { data: sel } = await supabase
        .from("vendor_establishments")
        .select("establishment_id")
        .eq("vendor_id", userId);

      const ids = (sel || []).map((s) => s.establishment_id);
      setSeleccionados(ids);
    };

    cargar();
  }, [userId]);

  // 🔍 Autocomplete
  const manejarBusqueda = async (valor) => {
    setBusqueda(valor);
    setSugerencias([]);

    if (valor.length < 3) return;

    setCargandoSug(true);
    const res = await autocompletarDireccion(valor);
    setSugerencias(res);
    setCargandoSug(false);
  };

  const seleccionarDireccion = (sug) => {
    setBusqueda(sug.label);
    setUbicacion({ lat: sug.lat, lng: sug.lng });
    setSugerencias([]);
  };

  // 📍 Ubicación actual del vendedor
  const usarUbicacionActual = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setUbicacion({ lat: latitude, lng: longitude });

      const rev = await reverseGeocodificar(latitude, longitude);
      if (rev) setBusqueda(rev.direccion);
    });
  };

  // ⭐ Selección de establecimientos
  const toggleSeleccion = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter((x) => x !== id));
    } else {
      setSeleccionados([...seleccionados, id]);
    }
  };

  // 💾 Guardar selección en Supabase
  const guardarSeleccion = async () => {
    if (!userId) {
      setMensaje("Usuario no autenticado.");
      return;
    }

    setGuardando(true);

    // 1. Borrar selección actual
    await supabase
      .from("vendor_establishments")
      .delete()
      .eq("vendor_id", userId);

    // 2. Insertar nueva selección
    const inserts = seleccionados.map((estId) => ({
      vendor_id: userId,
      establishment_id: estId,
    }));

    const { error } = await supabase
      .from("vendor_establishments")
      .insert(inserts);

    setGuardando(false);

    if (error) {
      setMensaje("Error al guardar selección.");
      return;
    }

    setMensaje("✅ Establecimientos guardados correctamente.");
  };

  // Ordenar establecimientos por distancia
  const listaOrdenada = [...establecimientos]
    .map((est) => {
      const distancia = ubicacion
        ? calcularDistanciaKm(ubicacion, {
            lat: est.lat,
            lng: est.lng,
          })
        : null;

      return { ...est, distancia };
    })
    .sort((a, b) => {
      if (a.distancia == null && b.distancia == null) return 0;
      if (a.distancia == null) return 1;
      if (b.distancia == null) return -1;
      return a.distancia - b.distancia;
    });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">
        Vendedor – Selección de Establecimientos
      </h1>

      {/* Buscar dirección */}
      <div>
        <label className="block text-sm mb-1">
          Mi ubicación (para ordenar por distancia):
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. Calle, colonia..."
              value={busqueda}
              onChange={(e) => manejarBusqueda(e.target.value)}
            />

            {cargandoSug && (
              <div className="absolute right-2 top-2 text-xs text-gray-400">
                ...
              </div>
            )}

            {sugerencias.length > 0 && (
              <ul className="absolute bg-white border rounded shadow mt-1 z-10 w-full text-sm max-h-48 overflow-auto">
                {sugerencias.map((s) => (
                  <li
                    key={s.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => seleccionarDireccion(s)}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={usarUbicacionActual}
            className="px-3 py-2 bg-gray-800 text-white rounded text-xs"
          >
            Usar mi ubicación
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Mapa</h2>
        <div className="h-80 rounded shadow overflow-hidden">
          <MapaEstablecimientos
            establecimientos={establecimientos}
            selectedPoint={ubicacion}
            onLocationSelected={(p) => setUbicacion(p)}
          />
        </div>
      </div>

      {/* LISTA */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Establecimientos disponibles
        </h2>

        <div className="border rounded shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Cap. Small</th>
                <th className="px-3 py-2">Cap. Med.</th>
                <th className="px-3 py-2">Distancia</th>
                <th className="px-3 py-2">Seleccionar</th>
              </tr>
            </thead>

            <tbody>
              {listaOrdenada.map((est) => (
                <tr key={est.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{est.nombre}</td>
                  <td className="px-3 py-2">{est.direccion}</td>
                  <td className="px-3 py-2">{est.capacidad_small}</td>
                  <td className="px-3 py-2">{est.capacidad_medium}</td>
                  <td className="px-3 py-2">
                    {est.distancia
                      ? est.distancia.toFixed(2) + " km"
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleSeleccion(est.id)}
                      className={`px-3 py-1 rounded text-xs ${
                        seleccionados.includes(est.id)
                          ? "bg-green-600 text-white"
                          : "bg-gray-300"
                      }`}
                    >
                      {seleccionados.includes(est.id)
                        ? "Seleccionado"
                        : "Seleccionar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        onClick={guardarSeleccion}
        disabled={guardando}
        className="px-5 py-2 bg-blue-600 text-white rounded font-semibold"
      >
        {guardando ? "Guardando..." : "Guardar selección"}
      </button>

      {mensaje && (
        <p className="mt-2 text-sm text-gray-700">{mensaje}</p>
      )}
    </div>
  );
}
