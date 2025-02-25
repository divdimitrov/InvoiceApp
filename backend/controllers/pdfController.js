const { generatePDF } = require("../services/pdfService");

async function exportPDF(req, res) {
  try {

    const { clientInfo, products } = req.body;

    if (!clientInfo || !products) {
      throw new Error("❌ Липсват clientInfo или products в заявката");
    }

    const pdfBuffer = await generatePDF(clientInfo, products);

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBuffer, "binary"));
  } catch (error) {
    console.error("❌ Грешка при генериране на PDF:", error);
    res.status(500).send("Грешка при генериране на PDF");
  }
}

module.exports = { exportPDF };
