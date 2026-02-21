const { generatePDF } = require("../services/pdfService");

async function exportPDF(req, res) {
  try {
    const { clientInfo, products } = req.body;

    if (!clientInfo || !products) {
      return res.status(400).json({ error: "Липсват clientInfo или products в заявката" });
    }

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "products трябва да бъде масив" });
    }

    for (const product of products) {
      if (!product.name || !product.unit || product.quantity == null || product.price == null) {
        return res.status(400).json({ error: "Всеки продукт трябва да има name, unit, quantity и price" });
      }
      if (isNaN(Number(product.quantity)) || isNaN(Number(product.price))) {
        return res.status(400).json({ error: "Количество и цена трябва да бъдат числа" });
      }
    }

    const pdfBuffer = await generatePDF(clientInfo, products);

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBuffer, "binary"));
  } catch (error) {
    console.error("❌ Грешка при генериране на PDF:", error);
    res.status(500).json({ error: "Грешка при генериране на PDF", detail: error.message });
  }
}

module.exports = { exportPDF };
