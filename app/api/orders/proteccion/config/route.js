import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  return Number(String(value || fallback).replace(",", "."));
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("dropit_config")
      .select("clave, valor")
      .in("clave", [
        "proteccion_enabled",
        "proteccion_porcentaje",
        "proteccion_valor_minimo",
        "proteccion_valor_maximo",
      ]);

    if (error) throw error;

    const cfg = {};

    data?.forEach((item) => {
      cfg[item.clave] = item.valor;
    });

    return NextResponse.json({
      enabled: cfg.proteccion_enabled === "true",
      porcentaje: toNumber(cfg.proteccion_porcentaje, 2),
      valorMinimo: toNumber(cfg.proteccion_valor_minimo, 500),
      valorMaximo: toNumber(cfg.proteccion_valor_maximo, 15000),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Error cargando configuración" },
      { status: 500 }
    );
  }
}