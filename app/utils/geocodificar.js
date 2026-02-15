// app/utils/geocodificar.js
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.warn("⚠️ Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local");
}

// Geocoding directo por texto (lo que ya usábamos para guardar)
export async function geocodificarDireccion(texto) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      texto
    )}.json?access_token=${MAPBOX_TOKEN}&country=mx&limit=1&language=es`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) return null;

    const [lng, lat] = data.features[0].center;

    return { lat, lng };
  } catch (err) {
    console.error("❌ Error en geocodificarDireccion:", err);
    return null;
  }
}

// Autocomplete estilo Uber: devuelve una lista de sugerencias
export async function autocompletarDireccion(query) {
  if (!query || query.length < 3) return [];

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_TOKEN}&country=mx&autocomplete=true&limit=5&language=es`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features) return [];

    return data.features.map((f) => {
      const [lng, lat] = f.center;

      let cp = "";
      if (Array.isArray(f.context)) {
        const cpItem = f.context.find((c) =>
          c.id.startsWith("postcode")
        );
        if (cpItem) cp = cpItem.text;
      }

      return {
        id: f.id,
        label: f.place_name,
        lat,
        lng,
        cp,
      };
    });
  } catch (err) {
    console.error("❌ Error en autocompletarDireccion:", err);
    return [];
  }
}

// Reverse geocoding: de lat/lng a dirección aproximada
export async function reverseGeocodificar(lat, lng) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=mx&limit=1&language=es`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const f = data.features[0];

    let cp = "";
    if (Array.isArray(f.context)) {
      const cpItem = f.context.find((c) => c.id.startsWith("postcode"));
      if (cpItem) cp = cpItem.text;
    }

    return {
      direccion: f.place_name,
      cp,
    };
  } catch (err) {
    console.error("❌ Error en reverseGeocodificar:", err);
    return null;
  }
}
