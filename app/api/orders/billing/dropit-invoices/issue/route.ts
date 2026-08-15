import { NextResponse } from "next/server";

import { getBillingUser } from "@/lib/billing/auth";
import { getPacProvider } from "@/lib/billing/pac/factory";
import { issueDropitInvoice } from "@/lib/billing/issueDropitInvoice";

export async function POST(req: Request) {
  try {
    // ==========================================
    // 1. Usuario autenticado
    // ==========================================

    const user =
      await getBillingUser(req);

    // ==========================================
    // 2. Payload
    // ==========================================

    const {
      pedido_id,
    } = await req.json();

    const pedidoId =
      Number(pedido_id);

    if (
      !Number.isInteger(pedidoId) ||
      pedidoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "pedido_id inválido",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. PAC configurado
    // ==========================================

    const pac =
      getPacProvider();

    // ==========================================
    // 4. Emitir factura Dropit
    // ==========================================

    const result =
      await issueDropitInvoice({
        pedidoId,
        vendedorId:
          user.id,
        pac,
      });

    return NextResponse.json({
      ok: true,

      invoice: {
        id:
          result.invoiceId,

        invoice_request_id:
          result.invoiceRequestId,

        uuid:
          result.uuid,

        serie:
          result.serie,

        folio:
          result.folio,

        subtotal:
          result.subtotal,

        impuestos:
          result.impuestos,

        total:
          result.total,

        fecha_emision:
          result.fechaEmision,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    // ==========================================
    // Autenticación
    // ==========================================

    if (
      message ===
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

    // ==========================================
    // Solicitud / pedido
    // ==========================================

    if (
      message ===
        "INVOICE_REQUEST_NOT_FOUND" ||
      message ===
        "ORDER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Solicitud de factura no encontrada",
        },
        { status: 404 }
      );
    }

    if (
      message ===
      "FISCAL_SNAPSHOT_INVALID"
    ) {
      return NextResponse.json(
        {
          error:
            "Los datos fiscales de la solicitud no son válidos",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // Invoice Dropit
    // ==========================================

    if (
      message ===
      "DROPIT_INVOICE_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Factura Dropit no encontrada",
        },
        { status: 404 }
      );
    }

    if (
      message ===
        "DROPIT_INVOICE_ALREADY_STAMPED" ||
      message ===
        "DROPIT_INVOICE_ALREADY_PROCESSING"
    ) {
      return NextResponse.json(
        {
          error:
            "La factura Dropit ya fue emitida o está siendo procesada",
        },
        { status: 409 }
      );
    }

    if (
      message ===
      "DROPIT_INVOICE_NOT_ISSUABLE"
    ) {
      return NextResponse.json(
        {
          error:
            "La factura Dropit no puede emitirse en su estado actual",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // Datos necesarios para CFDI
    // ==========================================

    if (
      message ===
        "ORDER_BALANCE_NOT_FOUND" ||
      message ===
        "UNSUPPORTED_CURRENCY"
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo determinar el importe de la factura",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // Error general
    // ==========================================

    console.error(
      "Error emitiendo factura Dropit:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo emitir la factura Dropit",
      },
      { status: 500 }
    );
  }
}