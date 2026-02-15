"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// -----------------------------------------------------
// 🔹 Fix iconos Leaflet default (ESTABLE)
// -----------------------------------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapaEstablecimientos({
  establecimientos = [],
  onMarkerClick,
}) {
  const center =
    establecimientos.length > 0
      ? [establecimientos[0].lat, establecimientos[0].lng]
      : [19.432608, -99.133209]; // CDMX

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="© Mapbox © OpenStreetMap"
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
      />

      {establecimientos.map((est) => (
        <Marker
          key={est.id}
          position={[est.lat, est.lng]}
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
              Small: {est.capacidad_small} — Medium:{" "}
              {est.capacidad_medium}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
