const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.warn("⚠️ Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local");
}

// Geocoding directo por texto
export async function geocodificarDireccion(texto) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      texto
    )}.json?access_token=${MAPBOX_TOKEN}&country=mx&limit=1&language=es`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const [lng, lat] = data.features[0].center;

    return { lat, lng };
  } catch (err) {
    console.error(
      "❌ Error en geocodificarDireccion:",
      err
    );

    return null;
  }
}

// Autocomplete de direcciones con sesgo opcional por proximidad
export async function autocompletarDireccion(
  query,
  proximity = null
) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: "mx",
      autocomplete: "true",
      limit: "5",
      language: "es",
      types: "address,postcode",
    });

    // Si conocemos una ubicación aproximada,
    // priorizamos resultados cercanos.
    if (
      proximity &&
      Number.isFinite(proximity.lat) &&
      Number.isFinite(proximity.lng)
    ) {
      params.set(
        "proximity",
        `${proximity.lng},${proximity.lat}`
      );
    }

    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
      `${encodeURIComponent(query.trim())}.json?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(
        "❌ Error Mapbox autocomplete:",
        res.status,
        res.statusText
      );

      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data.features)) {
      return [];
    }

    return data.features.map((f) => {
      const [lng, lat] = f.center;

      let cp = "";

      if (f.id?.startsWith("postcode")) {
        cp = f.text || "";
      }

      if (!cp && Array.isArray(f.context)) {
        const cpItem = f.context.find((c) =>
          c.id?.startsWith("postcode")
        );

        if (cpItem) {
          cp = cpItem.text || "";
        }
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
    console.error(
      "❌ Error en autocompletarDireccion:",
      err
    );

    return [];
  }
}

// Reverse geocoding: lat/lng → dirección aproximada
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
      const cpItem = f.context.find((c) =>
        c.id.startsWith("postcode")
      );

      if (cpItem) {
        cp = cpItem.text;
      }
    }

    return {
      direccion: f.place_name,
      cp,
    };
  } catch (err) {
    console.error(
      "❌ Error en reverseGeocodificar:",
      err
    );

    return null;
  }
}