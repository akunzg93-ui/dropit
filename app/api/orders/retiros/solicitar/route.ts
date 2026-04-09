import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔹 compatibilidad (viejo vs nuevo)
    let establecimientos = body.establecimientos;

    if (!establecimientos && body.establecimiento_id) {
      establecimientos = [
        {
          establecimiento_id: body.establecimiento_id,
          monto: body.monto,
        },
      ];
    }

    if (!establecimientos || establecimientos.length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🔥 VALIDACIONES
    for (const est of establecimientos) {
      const { establecimiento_id, monto } = est;

      if (!establecimiento_id || !monto || monto <= 0) {
        return NextResponse.json(
          { error: "Datos inválidos" },
          { status: 400 }
        );
      }

      // 🔥 bloqueo por establecimiento
      const { data: pendientes } = await supabase
        .from("retiros")
        .select("id")
        .eq("establecimiento_id", establecimiento_id)
        .in("status", ["pending", "approved"]);

      if (pendientes && pendientes.length > 0) {
        return NextResponse.json(
          { error: "Uno de los establecimientos ya tiene retiro en proceso" },
          { status: 400 }
        );
      }

      // 🔹 saldo
      const { data: saldoData } = await supabase
        .from("establecimiento_saldos")
        .select("saldo_disponible")
        .eq("establecimiento_id", establecimiento_id)
        .single();

      if (!saldoData) {
        return NextResponse.json(
          { error: "Error saldo" },
          { status: 500 }
        );
      }

      if (monto > saldoData.saldo_disponible) {
        return NextResponse.json(
          { error: "Saldo insuficiente en uno de los establecimientos" },
          { status: 400 }
        );
      }
    }

    // 🔥 total
    const total = establecimientos.reduce(
      (acc: number, e: any) => acc + Number(e.monto),
      0
    );

    // 🔥 crear retiro
    const { data: retiro, error: retiroError } = await supabase
      .from("retiros")
      .insert({
        monto: total,
        status: "pending",
        // 👇 compatibilidad temporal (admin actual)
        establecimiento_id: establecimientos[0].establecimiento_id,
      })
      .select()
      .single();

    if (retiroError) throw retiroError;

    // 🔥 crear detalles
    const detalles = establecimientos.map((e: any) => ({
      retiro_id: retiro.id,
      establecimiento_id: e.establecimiento_id,
      monto: e.monto,
    }));

    const { error: detallesError } = await supabase
      .from("retiro_detalles")
      .insert(detalles);

    if (detallesError) throw detallesError;

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}