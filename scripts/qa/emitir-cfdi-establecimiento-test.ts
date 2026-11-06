import "dotenv/config";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { getPacProvider } from "../../lib/billing/pac/factory";
import type { CfdiIssuePayload } from "../../lib/billing/invoice";

async function main() {
  // Protección obligatoria: nunca emitir en producción.
  if (process.env.BILLING_PAC_ENV !== "test") {
    throw new Error("QA_ONLY: BILLING_PAC_ENV debe ser test");
  }

  if (process.env.BILLING_PAC_PROVIDER !== "sw") {
    throw new Error("QA_ONLY: el proveedor debe ser SW");
  }

  const subtotal = 51.72;
  const iva = 8.28;

  const cfdi: CfdiIssuePayload = {
    version: "4.0",
    serie: "QA",
    folio: `EST85-${Date.now()}`,
    fecha: new Date().toISOString(),
    moneda: "MXN",
    tipoComprobante: "I",
    exportacion: "01",
    lugarExpedicion: "06002",

    emisor: {
      rfc: "H&E951128469",
      nombre: "HERRERIA & ELECTRICOS",
      regimenFiscal: "601",
      codigoPostal: "06002",
    },

    receptor: {
      rfc: "KAHO641101B39",
      nombre: "OSCAR KALA HAAK",
      regimenFiscal: "626",
      codigoPostal: "76074",
      usoCFDI: "G03",
    },

    conceptos: [
      {
        claveProductoServicio: "78131600",
        claveUnidad: "E48",
        unidad: "Servicio",
        descripcion:
          "Servicio de recepción, resguardo temporal y entrega de paquete",
        cantidad: 1,
        valorUnitario: subtotal,
        importe: subtotal,
        objetoImp: "02",
        tasaIVA: 0.16,
      },
    ],

    subtotal,
    impuestos: {
      totalTrasladados: iva,
    },
    total: 60,
  };

  console.log("\nCFDI DE PRUEBA:");
  console.log(JSON.stringify(cfdi, null, 2));

  if (process.argv[2] !== "--emitir") {
    console.log(
      "\nVista previa solamente. Para timbrar ejecuta con --emitir."
    );
    return;
  }

  const pac = getPacProvider();

  console.log("\nSolicitando timbrado a SW Test...");

  const issued = await pac.issueInvoice(cfdi, {
    formaPago: "03",
    metodoPago: "PUE",
  });

  if (!issued.uuid || !issued.xml) {
    throw new Error("SW no devolvió UUID o XML");
  }

  const outputDir = resolve("tmp/qa-cfdi");

  await mkdir(outputDir, { recursive: true });

  const xmlPath = resolve(outputDir, `${cfdi.folio}.xml`);

  await writeFile(xmlPath, issued.xml, "utf8");

  console.log("\nCFDI timbrado correctamente");
  console.log("UUID:", issued.uuid);
  console.log("XML:", xmlPath);
}

main().catch((error) => {
  console.error("\nError:", error);
  process.exitCode = 1;
});