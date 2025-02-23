const puppeteer = require("puppeteer");

async function generatePDF(clientInfo, products) {
  const totalAmount = products.reduce((sum, p) => sum + p.quantity * p.price, 0).toFixed(2);
  const vatAmount = (totalAmount * 0.2).toFixed(2);
  const grandTotal = (parseFloat(totalAmount) + parseFloat(vatAmount)).toFixed(2);

  const htmlContent = `
  <html>
  <head>
    <style>
      body { font-family: 'Arial', sans-serif; font-size: 14px; }
      h1 { text-align: center; font-size: 20px; font-weight: bold; }
      h2 { text-align: center; font-size: 18px; margin-bottom: 5px; }
      h3 { text-align: center; font-size: 16px; font-weight: bold; }
      p { font-size: 14px; margin: 5px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid black; padding: 8px; text-align: center; font-size: 14px; }
      th { background: lightgray; font-size: 14px; }
      .summary { margin-top: 20px; font-size: 14px; }
      .summary p { font-weight: bold; text-align: right; }
      .signature-container {
        display: flex;
        justify-content: space-between;
        margin-top: 50px;
      }
      .signature-box {
        width: 45%;
        text-align: center;
      }
      .signature-box p {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .signature-line {
        display: block;
        margin: 20px auto;
        width: 80%;
        border-top: 1px solid black;
      }
    </style>
  </head>
  <body>
    <h1>${clientInfo.protocolTitle}</h1>
    <h2>${clientInfo.protocolNumber}</h2>
    <h3>${clientInfo.completionText}</h3>
    <p><strong>Възложител:</strong> ${clientInfo.contractor}</p>
    <p><strong>Изпълнител:</strong> ${clientInfo.executor}</p>
    <p><strong>Обект:</strong> ${clientInfo.object}</p>
    <p>${clientInfo.protocolText}</p>

    <table>
      <tr>
        <th>№</th>
        <th>Наименование</th>
        <th>Мярка</th>
        <th>Количество</th>
        <th>Ед. цена без ДДС</th>
        <th>Обща цена без ДДС</th>
      </tr>
      ${products.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.unit}</td>
        <td>${p.quantity}</td>
        <td>${p.price.toFixed(2)}</td>
        <td>${(p.quantity * p.price).toFixed(2)}</td>
      </tr>`).join('')}
    </table>

    <div class="summary">
      <p>Обща стойност СМР без ДДС: <strong>${totalAmount} лв</strong></p>
      <p>ДДС 20%: <strong>${vatAmount} лв</strong></p>
      <p>Общо за фактуриране с ДДС: <strong>${grandTotal} лв</strong></p>
    </div>

    <div class="signature-container">
      <div class="signature-box">
        <p>За Възложителя:</p>
        <span class="signature-line"></span>
        <p>/ ${clientInfo.clientSignature || ".........................."} /</p>
      </div>
      <div class="signature-box">
        <p>За Изпълнителя:</p>
        <span class="signature-line"></span>
        <p>/ ${clientInfo.executorSignature || ".........................."} /</p>
      </div>
    </div>
  </body>
  </html>`;

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return pdfBuffer;
}

module.exports = { generatePDF };
