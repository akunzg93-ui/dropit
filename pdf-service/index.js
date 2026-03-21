const express = require("express");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generar-etiqueta", async (req, res) => {
  try {
    const { folio, codigo_vendedor } = req.body;

    if (!folio || !codigo_vendedor) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const qrPayload = `${folio}|${codigo_vendedor}`;
    const qrBuffer = await QRCode.toBuffer(qrPayload);

    const doc = new PDFDocument({
      size: [300, 420],
      margin: 0,
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    });

    // 🔲 BORDE
    doc
      .rect(12, 12, 276, 396)
      .lineWidth(1.5)
      .stroke("#e5e7eb");

    // 🔵 LOGO (más chico)
    const logoPath = path.join(
      __dirname,
      "..",
      "public",
      "brand",
      "logo-dropit.png"
    );

    doc.image(logoPath, 110, 25, { width: 80 });

    // 🔹 línea
    doc
      .moveTo(40, 85)
      .lineTo(260, 85)
      .stroke("#e5e7eb");

    // 🔵 FOLIO LABEL
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text("FOLIO", 0, 100, { align: "center" });

    // 🔵 FOLIO VALUE (centrado real)
    doc
      .fontSize(24)
      .fillColor("#000")
      .text(folio, 0, 115, { align: "center" });

    // 🔵 CÓDIGO
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Código", 0, 150, { align: "center" });

    doc
      .fontSize(16)
      .fillColor("#1e40af")
      .text(codigo_vendedor, 0, 165, { align: "center" });

    // 🔳 QR PERFECTAMENTE CENTRADO
    doc.image(qrBuffer, 65, 180, {
      width: 170,
    });

    // 🔹 línea inferior
    doc
      .moveTo(40, 350)
      .lineTo(260, 350)
      .stroke("#e5e7eb");

    // 🔵 FOOTER
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text("Escanea al recibir el paquete", 0, 365, {
        align: "center",
      });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

app.listen(4000, () => {
  console.log("🔥 PDF Service corriendo en http://localhost:4000");
});