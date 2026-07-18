"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function CrearPin({ seleccionado = false }) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${seleccionado ? "46px" : "38px"};
        height:${seleccionado ? "46px" : "38px"};
        border-radius:50% 50% 50% 0;
        background:#2563eb;
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 8px 18px rgba(37,99,235,.35);
        border:${seleccionado ? "4px solid #bfdbfe" : "3px solid white"};
      ">
        <div style="
          transform:rotate(45deg);
          color:white;
          font-size:${seleccionado ? "22px" : "18px"};
          line-height:1;
        ">
          📦
        </div>
      </div>
    `,
    iconSize: seleccionado ? [46, 46] : [38, 38],
    iconAnchor: seleccionado ? [23, 46] : [19, 38],
    popupAnchor: [0, -40],
  });
}

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    let resizeTimeout;
    let visibilityTimeout;
    let active = true;

    const invalidarMapa = () => {
      if (!active) return;

      try {
        const container = map.getContainer();

        if (!container || !container.isConnected) return;

        map.invalidateSize({
          animate: false,
          pan: false,
        });
      } catch (error) {
        console.warn("No se pudo reajustar el mapa:", error);
      }
    };

    resizeTimeout = window.setTimeout(() => {
      invalidarMapa();
    }, 250);

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      window.clearTimeout(visibilityTimeout);

      visibilityTimeout = window.setTimeout(() => {
        invalidarMapa();
      }, 300);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;

      window.clearTimeout(resizeTimeout);
      window.clearTimeout(visibilityTimeout);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [map]);

  return null;
}

export default function MapaEstablecimientos({
  establecimientos = [],
  seleccionados = [],
  onMarkerClick,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const establecimientosValidos = useMemo(() => {
    return establecimientos.filter((est) => {
      const lat = Number(est?.lat);
      const lng = Number(est?.lng);

      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [establecimientos]);

  const center =
    establecimientosValidos.length > 0
      ? [
          Number(establecimientosValidos[0].lat),
          Number(establecimientosValidos[0].lng),
        ]
      : [19.432608, -99.133209];

  const mapKey = useMemo(() => {
    return (
      establecimientosValidos
        .map((est) => est.uuid || est.id)
        .filter(Boolean)
        .join("-") || "mapa-establecimientos"
    );
  }, [establecimientosValidos]);

  if (!mounted) {
    return (
      <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
    );
  }

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <ResizeMap />

      <TileLayer
        attribution="© Mapbox © OpenStreetMap"
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
      />

      {establecimientosValidos.map((est) => {
        const identificador = est.uuid || est.id;

        const seleccionado = seleccionados.some(
          (seleccionadoActual) =>
            (seleccionadoActual.uuid || seleccionadoActual.id) === identificador
        );

        return (
          <Marker
            key={identificador}
            position={[Number(est.lat), Number(est.lng)]}
            icon={CrearPin({ seleccionado })}
            eventHandlers={{
              click: () => {
                onMarkerClick?.(est);
              },
            }}
          >
            <Popup>
              <strong>{est.nombre}</strong>
              <br />
              {est.direccion}
              <br />
              <span className="text-xs">
                Pequeño: {est.capacidad_small} — Mediano:{" "}
                {est.capacidad_medium}
              </span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}