import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

// --------------------------------------------------
// PRECIOS DROPIT
// --------------------------------------------------

const PRECIOS = {
  small: 60,
  medium: 90,
} as const;

// --------------------------------------------------
// CUPONES
// Deben coincidir con los actualmente disponibles
// en la pantalla de compra.
// --------------------------------------------------

const CUPONES_VALIDOS = {
  DROPIT10: 0.1,
  BIENVENIDO15: 0.15,
} as const;

type CoinTipo = keyof typeof PRECIOS;

type CoinItem = {
  tipo: CoinTipo;
  cantidad: number;
  precio_unitario: number;
};

type TipoDescuento =
  | "ninguno"
  | "cantidad"
  | "cupon";

// --------------------------------------------------
// DESCUENTO POR VOLUMEN
// --------------------------------------------------

function calcularDescuentoCantidad(
  cantidadTotal: number
) {
  if (cantidadTotal >= 50) return 0.12;
  if (cantidadTotal >= 10) return 0.1;

  return 0;
}

// --------------------------------------------------
// CUPÓN
// --------------------------------------------------

function obtenerDescuentoCupon(
  cupon?: string | null
) {
  if (!cupon) {
    return {
      codigo: null,
      descuento: 0,
    };
  }

  const codigo = cupon
    .trim()
    .toUpperCase();

  const descuento =
    CUPONES_VALIDOS[
      codigo as keyof typeof CUPONES_VALIDOS
    ];

  if (!descuento) {
    throw new Error("CUPON_INVALIDO");
  }

  return {
    codigo,
    descuento,
  };
}

export async function POST(req: Request) {
  let pagoId: string | null = null;

  try {
    // --------------------------------------------------
    // 1. Usuario autenticado
    // --------------------------------------------------

    const user =
      await getBillingUser(req);

    const {
      items,
      cupon,
    } = await req.json();

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Items inválidos",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Validar items y congelar precios
    // --------------------------------------------------

    let subtotal = 0;
    let cantidadTotal = 0;

    const itemsNormalizados: CoinItem[] =
      [];

    for (const item of items) {
      const tipo =
        item?.tipo as CoinTipo;

      const cantidad = Number(
        item?.cantidad
      );

      if (
        !["small", "medium"].includes(
          tipo
        ) ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        return NextResponse.json(
          {
            error: "Item inválido",
          },
          { status: 400 }
        );
      }

      const precioUnitario =
        PRECIOS[tipo];

      subtotal +=
        precioUnitario * cantidad;

      cantidadTotal += cantidad;

      itemsNormalizados.push({
        tipo,
        cantidad,
        precio_unitario:
          precioUnitario,
      });
    }

    // --------------------------------------------------
    // 3. Calcular descuentos
    // --------------------------------------------------

    const descuentoCantidad =
      calcularDescuentoCantidad(
        cantidadTotal
      );

    const {
      codigo: cuponNormalizado,
      descuento: descuentoCupon,
    } = obtenerDescuentoCupon(
      cupon
    );

    const descuentoFinal =
      Math.max(
        descuentoCantidad,
        descuentoCupon
      );

    let descuentoTipo:
      TipoDescuento = "ninguno";

    if (descuentoFinal > 0) {
      descuentoTipo =
        descuentoCupon >
        descuentoCantidad
          ? "cupon"
          : "cantidad";
    }

    /*
      Si ambos descuentos son exactamente
      iguales y existe cupón, conservamos
      "cupon" como origen para trazabilidad.
    */
    if (
      descuentoFinal > 0 &&
      cuponNormalizado &&
      descuentoCupon ===
        descuentoCantidad
    ) {
      descuentoTipo = "cupon";
    }

    // --------------------------------------------------
    // 4. Total definitivo calculado en servidor
    // --------------------------------------------------

    const descuentoMonto =
      Number(
        (
          subtotal *
          descuentoFinal
        ).toFixed(2)
      );

    const totalPesos =
      Number(
        (
          subtotal -
          descuentoMonto
        ).toFixed(2)
      );

    const totalCentavos =
      Math.round(
        totalPesos * 100
      );

    if (totalCentavos <= 0) {
      return NextResponse.json(
        {
          error:
            "El total del pago no es válido",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Cliente administrativo Supabase
    // --------------------------------------------------

    const supabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .SUPABASE_SERVICE_ROLE_KEY!
      );

    // --------------------------------------------------
    // 6. Snapshot completo de la compra
    // --------------------------------------------------

    const metadataPago = {
      tipo_operacion:
        "compra_coins",

      items:
        itemsNormalizados,

      subtotal_mxn:
        subtotal,

      cantidad_total:
        cantidadTotal,

      descuento_tipo:
        descuentoTipo,

      descuento_cantidad_porcentaje:
        descuentoCantidad * 100,

      descuento_cupon_porcentaje:
        descuentoCupon * 100,

      descuento_porcentaje:
        descuentoFinal * 100,

      descuento_monto_mxn:
        descuentoMonto,

      cupon:
        cuponNormalizado,

      total_mxn:
        totalPesos,
    };

    // --------------------------------------------------
    // 7. Crear pago pending
    // --------------------------------------------------

    const {
      data: pago,
      error: pagoError,
    } = await supabase
      .from("pagos")
      .insert({
        user_id:
          user.id,

        proveedor:
          "stripe",

        /*
          Convención:
          amount_total se guarda
          en centavos.
        */
        amount_total:
          totalCentavos,

        currency:
          "mxn",

        status:
          "pending",

        metadata:
          metadataPago,
      })
      .select("id")
      .single();

    if (
      pagoError ||
      !pago
    ) {
      console.error(
        "Error creando pago:",
        pagoError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo registrar el pago",
        },
        { status: 500 }
      );
    }

    pagoId = pago.id;

    // --------------------------------------------------
    // 8. Crear PaymentIntent
    // --------------------------------------------------

    const paymentIntent =
      await stripe.paymentIntents.create(
        {
          amount:
            totalCentavos,

          currency:
            "mxn",

          automatic_payment_methods: {
            enabled: true,
          },

          metadata: {
            pago_id:
              pago.id,

            user_id:
              user.id,

            tipo_operacion:
              "compra_coins",

            items:
              JSON.stringify(
                itemsNormalizados
              ),

            subtotal_mxn:
              subtotal.toString(),

            cantidad_total:
              cantidadTotal.toString(),

            descuento_tipo:
              descuentoTipo,

            descuento_porcentaje:
              (
                descuentoFinal * 100
              ).toString(),

            cupon:
              cuponNormalizado ||
              "",

            total_mxn:
              totalPesos.toString(),
          },
        },
        {
          idempotencyKey:
            `dropit_pago_${pago.id}`,
        }
      );

    // --------------------------------------------------
    // 9. Vincular pago ↔ PaymentIntent
    // --------------------------------------------------

    const {
      error: updateError,
    } = await supabase
      .from("pagos")
      .update({
        stripe_payment_intent_id:
          paymentIntent.id,
      })
      .eq(
        "id",
        pago.id
      );

    if (updateError) {
      console.error(
        "Error vinculando PaymentIntent:",
        updateError
      );

      await supabase
        .from("pagos")
        .update({
          status:
            "failed",
        })
        .eq(
          "id",
          pago.id
        );

      return NextResponse.json(
        {
          error:
            "No se pudo vincular el pago con Stripe",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. Respuesta al frontend
    // --------------------------------------------------

    return NextResponse.json({
      ok: true,

      clientSecret:
        paymentIntent.client_secret,

      paymentIntentId:
        paymentIntent.id,

      pagoId:
        pago.id,

      subtotal,

      descuento:
        descuentoFinal * 100,

      descuentoTipo,

      cupon:
        cuponNormalizado,

      total:
        totalPesos,
    });
  } catch (error) {
    // --------------------------------------------------
    // Si ya existía pago, evitar dejarlo ambiguo
    // --------------------------------------------------

    if (pagoId) {
      try {
        const supabase =
          createClient(
            process.env
              .NEXT_PUBLIC_SUPABASE_URL!,
            process.env
              .SUPABASE_SERVICE_ROLE_KEY!
          );

        await supabase
          .from("pagos")
          .update({
            status: "failed",
          })
          .eq(
            "id",
            pagoId
          );
      } catch (
        updateError
      ) {
        console.error(
          "Error marcando pago fallido:",
          updateError
        );
      }
    }

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "CUPON_INVALIDO"
    ) {
      return NextResponse.json(
        {
          error:
            "El cupón no es válido",
        },
        { status: 400 }
      );
    }

    console.error(
      "❌ Error creando PaymentIntent:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creando pago",
      },
      { status: 500 }
    );
  }
}