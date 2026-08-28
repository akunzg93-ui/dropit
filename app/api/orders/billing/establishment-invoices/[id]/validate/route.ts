import { NextResponse } from "next/server";
import { getBillingUser } from "@/lib/billing/auth";
import { validateEstablishmentCfdi } from "@/lib/billing/validateCfdi";

export async function POST(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getBillingUser(req);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Solicitud de factura requerida",
        },
        { status: 400 }
      );
    }

    const result =
      await validateEstablishmentCfdi({
        invoiceRequestId: id,
        establecimientoUserId: user.id,
      });

    if (!result.valid) {
      return NextResponse.json(
        {
          ok: false,
          stage: result.stage,
          errors: result.errors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
  ok: true,
  stage: result.stage,
  invoice_id: result.invoiceId,
  cfdi: result.cfdi,
});
  } catch (error) {
    if (!(error instanceof Error)) {
      return NextResponse.json(
        { error: "Error interno" },
        { status: 500 }
      );
    }

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        );

      case "FORBIDDEN":
        return NextResponse.json(
          {
            error:
              "No autorizado para esta factura",
          },
          { status: 403 }
        );

      case "INVOICE_REQUEST_NOT_FOUND":
      case "ORDER_NOT_FOUND":
      case "ESTABLISHMENT_NOT_FOUND":
      case "INVOICE_NOT_FOUND":
      case "BALANCE_MOVEMENT_NOT_FOUND":
        return NextResponse.json(
          {
            error:
              "No se encontró la información requerida",
          },
          { status: 404 }
        );

      case "ESTABLISHMENT_FISCAL_PROFILE_MISSING":
        return NextResponse.json(
          {
            error:
              "El establecimiento no tiene un perfil fiscal asignado",
          },
          { status: 409 }
        );

      case "ESTABLISHMENT_FISCAL_PROFILE_INVALID":
        return NextResponse.json(
          {
            error:
              "El perfil fiscal del establecimiento no es válido",
          },
          { status: 409 }
        );

      case "XML_NOT_UPLOADED":
        return NextResponse.json(
          {
            error:
              "No se ha cargado el XML de la factura",
          },
          { status: 409 }
        );

      case "INVOICE_NOT_VALIDATABLE":
        return NextResponse.json(
          {
            error:
              "La factura no puede validarse en su estado actual",
          },
          { status: 409 }
        );

      default:
        console.error(
          "Error validando CFDI establecimiento:",
          error
        );

        return NextResponse.json(
          { error: "Error interno" },
          { status: 500 }
        );
    }
  }
}