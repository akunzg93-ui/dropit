const express = require("express");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "2mb",
  })
);

// ======================================================
// Helpers
// ======================================================

function money(value) {
  const number = Number(value || 0);

  return number.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function text(value) {
  return String(value || "").trim();
}

function buildPdfResponse(doc, res) {
  const chunks = [];

  doc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  doc.on("end", () => {
    const pdfBuffer =
      Buffer.concat(chunks);

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.send(pdfBuffer);
  });
}

// ======================================================
// ETIQUETA EXISTENTE
// ======================================================

app.post(
  "/generar-etiqueta",
  async (req, res) => {
    try {
      const {
        folio,
        codigo_vendedor,
      } = req.body;

      if (
        !folio ||
        !codigo_vendedor
      ) {
        return res
          .status(400)
          .json({
            error:
              "Datos incompletos",
          });
      }

      const qrPayload =
        `${folio}|${codigo_vendedor}`;

      const qrBuffer =
        await QRCode.toBuffer(
          qrPayload
        );

      const doc =
        new PDFDocument({
          size: [300, 420],
          margin: 0,
        });

      buildPdfResponse(
        doc,
        res
      );

      // BORDE
      doc
        .rect(
          12,
          12,
          276,
          396
        )
        .lineWidth(1.5)
        .stroke("#e5e7eb");

      // LOGO
      const logoPath =
        path.join(
          __dirname,
          "..",
          "public",
          "brand",
          "logo-dropit.png"
        );

      doc.image(
        logoPath,
        110,
        25,
        {
          width: 80,
        }
      );

      doc
        .moveTo(40, 85)
        .lineTo(260, 85)
        .stroke("#e5e7eb");

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .text(
          "FOLIO",
          0,
          100,
          {
            align: "center",
          }
        );

      doc
        .fontSize(24)
        .fillColor("#000")
        .text(
          folio,
          0,
          115,
          {
            align: "center",
          }
        );

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          "Código",
          0,
          150,
          {
            align: "center",
          }
        );

      doc
        .fontSize(16)
        .fillColor("#1e40af")
        .text(
          codigo_vendedor,
          0,
          165,
          {
            align: "center",
          }
        );

      doc.image(
        qrBuffer,
        65,
        180,
        {
          width: 170,
        }
      );

      doc
        .moveTo(40, 350)
        .lineTo(260, 350)
        .stroke("#e5e7eb");

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .text(
          "Escanea al recibir el paquete",
          0,
          365,
          {
            align: "center",
          }
        );

      doc.end();
    } catch (err) {
      console.error(
        "Error generando etiqueta:",
        err
      );

      if (
        !res.headersSent
      ) {
        res
          .status(500)
          .json({
            error:
              "Error generando PDF",
          });
      }
    }
  }
);

// ======================================================
// FACTURA DROPIT
// ======================================================

app.post(
  "/generar-factura",
  async (req, res) => {
    try {
      const {
  uuid,
  serie,
  folio,
  fecha,

  fechaTimbrado,
  noCertificadoCfdi,
  noCertificadoSat,
  selloCfdi,
  selloSat,
  rfcProvCertif,

  formaPago,
  metodoPago,

        emisor,
        receptor,

        conceptos,

        subtotal,
        impuestos,
        total,
      } = req.body;

      if (
        !uuid ||
        !folio ||
        !emisor?.rfc ||
        !receptor?.rfc ||
        !Array.isArray(
          conceptos
        ) ||
        conceptos.length === 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Datos de factura incompletos",
          });
      }

      // ----------------------------------------------
      // QR Dropit / fiscal
      //
      // Por ahora contiene UUID.
      // Después podemos construir el QR SAT oficial.
      // ----------------------------------------------

      const qrBuffer =
        await QRCode.toBuffer(
          text(uuid),
          {
            width: 180,
          }
        );

      const doc =
        new PDFDocument({
          size: "LETTER",
          margin: 42,
          info: {
            Title:
              `Factura ${serie || ""}-${folio}`,
            Author:
              "Dropit",
          },
        });

      buildPdfResponse(
        doc,
        res
      );

      const logoPath =
        path.join(
          __dirname,
          "..",
          "public",
          "brand",
          "logo-dropit.png"
        );

      // ==================================================
      // HEADER
      // ==================================================

      doc.image(
        logoPath,
        42,
        40,
        {
          width: 95,
        }
      );

      doc
        .fontSize(9)
        .fillColor("#64748b")
        .text(
          "COMPROBANTE FISCAL DIGITAL",
          330,
          42,
          {
            align: "right",
          }
        );

      doc
        .fontSize(18)
        .fillColor("#1e3a8a")
        .text(
          `${text(
            serie
          )}-${text(
            folio
          )}`,
          330,
          58,
          {
            align: "right",
          }
        );

      doc
        .fontSize(9)
        .fillColor("#64748b")
        .text(
          `Fecha: ${text(
            fecha
          )}`,
          330,
          84,
          {
            align: "right",
          }
        );

      doc
        .moveTo(
          42,
          118
        )
        .lineTo(
          570,
          118
        )
        .strokeColor(
          "#e2e8f0"
        )
        .stroke();

      // ==================================================
      // EMISOR / RECEPTOR
      // ==================================================

      const partyTop = 138;

      doc
        .fontSize(9)
        .fillColor("#2563eb")
        .text(
          "EMISOR",
          42,
          partyTop
        );

      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .text(
          text(
            emisor.nombre
          ),
          42,
          partyTop + 17,
          {
            width: 235,
          }
        );

      doc
        .fontSize(9)
        .fillColor("#475569")
        .text(
          `RFC: ${text(
            emisor.rfc
          )}`,
          42,
          partyTop + 38
        );

      doc.text(
        `Régimen fiscal: ${text(
          emisor.regimenFiscal
        )}`,
        42,
        partyTop + 52
      );

      doc.text(
        `CP: ${text(
          emisor.codigoPostal
        )}`,
        42,
        partyTop + 66
      );

      doc
        .fontSize(9)
        .fillColor("#2563eb")
        .text(
          "RECEPTOR",
          310,
          partyTop
        );

      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .text(
          text(
            receptor.nombre
          ),
          310,
          partyTop + 17,
          {
            width: 260,
          }
        );

      doc
        .fontSize(9)
        .fillColor("#475569")
        .text(
          `RFC: ${text(
            receptor.rfc
          )}`,
          310,
          partyTop + 38
        );

      doc.text(
        `Régimen fiscal: ${text(
          receptor.regimenFiscal
        )}`,
        310,
        partyTop + 52
      );

      doc.text(
        `CP: ${text(
          receptor.codigoPostal
        )}`,
        310,
        partyTop + 66
      );

      doc.text(
        `Uso CFDI: ${text(
          receptor.usoCFDI
        )}`,
        310,
        partyTop + 80
      );

      // ==================================================
      // CONCEPTOS
      // ==================================================

      let y = 250;

      doc
        .roundedRect(
          42,
          y,
          528,
          26,
          4
        )
        .fill(
          "#eff6ff"
        );

      doc
        .fillColor(
          "#1e3a8a"
        )
        .fontSize(8)
        .text(
          "DESCRIPCIÓN",
          52,
          y + 9
        );

      doc.text(
        "CANT.",
        355,
        y + 9,
        {
          width: 45,
          align: "right",
        }
      );

      doc.text(
        "PRECIO",
        410,
        y + 9,
        {
          width: 65,
          align: "right",
        }
      );

      doc.text(
        "IMPORTE",
        485,
        y + 9,
        {
          width: 75,
          align: "right",
        }
      );

      y += 36;

      for (
        const concepto of conceptos
      ) {
        doc
          .fontSize(9)
          .fillColor(
            "#0f172a"
          )
          .text(
            text(
              concepto.descripcion
            ),
            52,
            y,
            {
              width: 285,
            }
          );

        doc.text(
          text(
            concepto.cantidad
          ),
          355,
          y,
          {
            width: 45,
            align: "right",
          }
        );

        doc.text(
          `$${money(
            concepto.valorUnitario
          )}`,
          410,
          y,
          {
            width: 65,
            align: "right",
          }
        );

        doc.text(
          `$${money(
            concepto.importe
          )}`,
          485,
          y,
          {
            width: 75,
            align: "right",
          }
        );

        y += 32;
      }

      doc
        .moveTo(
          42,
          y
        )
        .lineTo(
          570,
          y
        )
        .strokeColor(
          "#e2e8f0"
        )
        .stroke();

      y += 20;

      // ==================================================
      // TOTALES
      // ==================================================

      doc
        .fontSize(9)
        .fillColor(
          "#475569"
        )
        .text(
          "Subtotal",
          385,
          y,
          {
            width: 90,
            align: "right",
          }
        );

      doc
        .fillColor(
          "#0f172a"
        )
        .text(
          `$${money(
            subtotal
          )}`,
          485,
          y,
          {
            width: 75,
            align: "right",
          }
        );

      y += 18;

      doc
        .fillColor(
          "#475569"
        )
        .text(
          "IVA",
          385,
          y,
          {
            width: 90,
            align: "right",
          }
        );

      doc
        .fillColor(
          "#0f172a"
        )
        .text(
          `$${money(
            impuestos
          )}`,
          485,
          y,
          {
            width: 75,
            align: "right",
          }
        );

      y += 22;

      doc
        .fontSize(13)
        .fillColor(
          "#1e3a8a"
        )
        .text(
          "Total",
          385,
          y,
          {
            width: 90,
            align: "right",
          }
        );

      doc.text(
        `$${money(
          total
        )} MXN`,
        475,
        y,
        {
          width: 85,
          align: "right",
        }
      );

      y += 42;

     // ==================================================
// DATOS FISCALES
// ==================================================

doc
  .roundedRect(
    42,
    y,
    528,
    190,
    8
  )
  .fill("#f8fafc");

// UUID

doc
  .fontSize(8)
  .fillColor("#64748b")
  .text(
    "UUID FISCAL",
    58,
    y + 16
  );

doc
  .fontSize(10)
  .fillColor("#0f172a")
  .text(
    text(uuid),
    58,
    y + 30,
    {
      width: 320,
    }
  );

// Datos de timbrado

doc
  .fontSize(7.5)
  .fillColor("#64748b")
  .text(
    `Fecha de timbrado: ${text(fechaTimbrado)}`,
    58,
    y + 52
  );

doc.text(
  `RFC proveedor certificación: ${text(rfcProvCertif)}`,
  58,
  y + 66
);

doc.text(
  `No. certificado CFDI: ${text(noCertificadoCfdi)}`,
  58,
  y + 80
);

doc.text(
  `No. certificado SAT: ${text(noCertificadoSat)}`,
  58,
  y + 94
);

// Pago

doc.text(
  `Forma de pago: ${text(formaPago)}`,
  58,
  y + 108
);

doc.text(
  `Método de pago: ${text(metodoPago)}`,
  58,
  y + 122
);

// Sellos

doc
  .fontSize(7)
  .fillColor("#64748b")
  .text(
    `Sello CFDI: ${text(selloCfdi)}`,
    58,
    y + 140,
    {
      width: 370,
      height: 16,
      ellipsis: true,
    }
  );

doc.text(
  `Sello SAT: ${text(selloSat)}`,
  58,
  y + 158,
  {
    width: 370,
    height: 16,
    ellipsis: true,
  }
);

// QR

doc.image(
  qrBuffer,
  455,
  y + 20,
  {
    width: 96,
  }
);

doc
  .fontSize(7.5)
  .fillColor("#64748b")
  .text(
    "Este documento es una representación impresa de un CFDI.",
    58,
    y + 176
  );
      // ==================================================
      // FOOTER
      // ==================================================

      doc
        .fontSize(8)
        .fillColor(
          "#94a3b8"
        )
        .text(
          "Dropit · Documento generado a partir del XML fiscal timbrado.",
          42,
          738,
          {
            width: 528,
            align: "center",
          }
        );

      doc.end();
    } catch (err) {
      console.error(
        "Error generando factura:",
        err
      );

      if (
        !res.headersSent
      ) {
        res
          .status(500)
          .json({
            error:
              "Error generando factura PDF",
          });
      }
    }
  }
);

// ======================================================
// SERVER
// ======================================================

app.listen(
  4000,
  () => {
    console.log(
      "🔥 PDF Service corriendo en http://localhost:4000"
    );
  }
);