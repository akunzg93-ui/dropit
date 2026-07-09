"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
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

  const establecimientosValidos = establecimientos.filter(
    (est) => est?.lat && est?.lng
  );

  const center =
    establecimientosValidos.length > 0
      ? [establecimientosValidos[0].lat, establecimientosValidos[0].lng]
      : [19.432608, -99.133209];

  const mapKey = useMemo(() => {
    return establecimientosValidos.map((e) => e.id).join("-");
  }, [establecimientosValidos]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
    );
  }

  return (
    <MapContainer
      key={mapKey || "mapa-establecimientos"}
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
        const seleccionado = seleccionados.some((e) => e.id === est.id);

        return (
          <Marker
            key={est.id}
            position={[est.lat, est.lng]}
            icon={CrearPin({ seleccionado })}
            eventHandlers={{
              click: () => {
                onMarkerClick && onMarkerClick(est);
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