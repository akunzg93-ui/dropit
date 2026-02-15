"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../../../lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapaEstablecimientos() {
  const mapaRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  const [establecimientos, setEstablecimientos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // ----------------------------------------------------------------
  // 1. Cargar establecimientos desde Supabase
  // ----------------------------------------------------------------
  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase.from("establecimientos").select("*");

      if (error) {
        console.error("Error en Supabase:", error);
        return;
      }

      console.log("Datos desde Supabase:", data);

      setEstablecimientos(data || []);
      setFiltrados(data || []);
    }

    cargar();
  }, []);

  // ----------------------------------------------------------------
  // 2. Inicializar mapa (solo una vez)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!mapaRef.current) return;

    map.current = new mapboxgl.Map({
      container: mapaRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-99.1332, 19.4326],
      zoom: 12,
    });

    return () => map.current?.remove();
  }, []);

  // ----------------------------------------------------------------
  // 3. Dibujar marcadores SIEMPRE que filtrados cambie
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!map.current) return;

    // Asegura que el mapa está listo
    map.current.once("load", () => {
      pintarMarcadores();
    });

    // Si el mapa ya estaba cargado (no es primera vez)
    if (map.current.loaded()) {
      pintarMarcadores();
    }
  }, [filtrados]);

  function pintarMarcadores() {
    if (!map.current) return;

    // 1. Quitar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 2. Dibujar nuevos
    filtrados.forEach((e) => {
      if (!e.lat || !e.lng) return;

      const lat = Number(e.lat);
      const lng = Number(e.lng);

      const marker = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      marker.getElement().addEventListener("click", () => {
        setSelected(e);
        map.current.flyTo({ center: [lng, lat], zoom: 14 });
      });

      markersRef.current.push(marker);
    });

    console.log("Marcadores dibujados:", markersRef.current.length);
  }

  // ----------------------------------------------------------------
  // 4. Filtro
  // ----------------------------------------------------------------
  function filtrar(valor) {
    setBusqueda(valor);

    const texto = valor.toLowerCase();

    const f = establecimientos.filter((e) =>
      (e.nombre || "").toLowerCase().includes(texto) ||
      (e.cp || "").includes(texto) ||
      (e.direccion || "").toLowerCase().includes(texto)
    );

    setFiltrados(f);
  }

  // ----------------------------------------------------------------
  // 5. Geolocalización
  // ----------------------------------------------------------------
  function centrarEnMiUbicacion() {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
      });

      new mapboxgl.Marker({ color: "red" })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    });
  }

  return (
    <div className="flex gap-4 h-[85vh]">

      {/* SIDEBAR IZQUIERDO */}
      <Card className="w-80 p-4 shadow-lg flex flex-col">
        <h2 className="font-bold text-lg mb-4">Establecimientos</h2>

        <Input
          value={busqueda}
          onChange={(e) => filtrar(e.target.value)}
          placeholder="Buscar por nombre o CP..."
          className="mb-3"
        />

        <Button onClick={centrarEnMiUbicacion} className="w-full mb-3">
          📍 Mi ubicación
        </Button>

        <div className="overflow-auto h-full space-y-2">
          {filtrados.map((e) => (
            <Card
              key={e.id}
              className={`p-3 cursor-pointer hover:bg-blue-100 ${
                selected?.id === e.id ? "bg-blue-200" : ""
              }`}
              onClick={() => {
                setSelected(e);
                map.current.flyTo({ center: [e.lng, e.lat], zoom: 14 });
              }}
            >
              <h3 className="font-semibold">{e.nombre}</h3>
              <p className="text-sm">{e.direccion}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* MAPA */}
      <Card className="w-full h-full shadow-card relative">
        <div ref={mapaRef} className="w-full h-full rounded-xl" />

        {selected && (
          <div className="absolute top-5 right-5 bg-white p-4 rounded-lg shadow-xl w-72">
            <h2 className="font-bold text-lg">{selected.nombre}</h2>
            <p className="text-sm">{selected.direccion}</p>
            <p className="text-sm">CP: {selected.cp}</p>

            <Button
              onClick={() => setSelected(null)}
              variant="destructive"
              className="w-full mt-4"
            >
              Cerrar
            </Button>
          </div>
        )}
      </Card>

    </div>
  );
}
