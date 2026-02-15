import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRECIOS = {
  small: 30,
  medium: 45,
};

function calcularDescuento(cantidad: number) {
  if (cantidad >= 50) return 12;
  if (cantidad >= 10) return 10;
  return 0;
}

export async function POST(req: Request) {
  try {
    const { user_id, items } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items inválidos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const item of items) {
      const { tipo, cantidad } = item;

      if (!["small", "medium"].includes(tipo) || cantidad <= 0) {
        return NextResponse.json(
          { error: "Item inválido" },
          { status: 400 }
        );
      }

      const precioUnitario = PRECIOS[tipo as "small" | "medium"];
      const descuento = calcularDescuento(cantidad);

      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

      // 🔹 Crear lote
      const { data: lote, error: loteError } = await supabase
        .from("coin_lotes")
        .insert({
          user_id,
          tipo,
          cantidad_total: cantidad,
          cantidad_disponible: cantidad,
          precio_unitario: precioUnitario,
          descuento_porcentaje: descuento,
          fecha_expiracion: fechaExpiracion.toISOString(),
        })
        .select()
        .single();

      if (loteError) {
        console.error(loteError);
        return NextResponse.json(
          { error: "Error creando lote de coins" },
          { status: 500 }
        );
      }

      // 🔹 Movimiento contable
      const { error: movError } = await supabase
        .from("coin_movimientos")
        .insert({
          user_id,
          lote_id: lote.id,
          tipo: "compra",
          coin_tipo: tipo,
          cantidad,
          referencia: "compra_manual",
        });

      if (movError) {
        console.error(movError);
        return NextResponse.json(
          { error: "Error registrando movimiento" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Coins compradas correctamente",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
