const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const fs = require("fs");
const path = require("path");

/**
 * Escapes HTML special characters to prevent XSS in generated PDF.
 */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function generatePDF(clientInfo, products) {
  const totalAmount = products.reduce((sum, p) => sum + Number(p.quantity) * Number(p.price), 0);
  const vatAmount = totalAmount * 0.2;
  const grandTotal = totalAmount + vatAmount;

  // Read logo as base64
  let logoBase64 = "";
  try {
    const logoPath = path.join(__dirname, "..", "..", "frontend", "public", "logoAS.png");
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (e) {
    console.warn("Logo not found, PDF will be generated without it.");
  }

  // Build protocol text from structured fields
  const protocolDate = clientInfo.protocolDate
    ? new Date(clientInfo.protocolDate).toLocaleDateString("bg-BG")
    : ".......................";
  const contractorName = clientInfo.clientSignature || "...............................................";
  const executorName = clientInfo.executorSignature || "Александър Караманов";
  const completionDate = clientInfo.completionDate
    ? new Date(clientInfo.completionDate).toLocaleDateString("bg-BG")
    : ".......................";

  const protocolText = `Днес ${protocolDate} Подписаните, представители на Възложителя - ${contractorName} и ${executorName} - представител на Изпълнителя, след проверка на място установихме, че към ${completionDate} са извършени и подлежат на заплащане въз основа на този протокол, следните натурални видове строително и монтажни работи`;

  const productRows = products.map((p, i) => {
    const qty = Number(p.quantity);
    const price = Number(p.price);
    return `
      <tr>
        <td class="col-num">${i + 1}</td>
        <td class="col-name">${escapeHtml(p.name)}</td>
        <td class="col-unit">${escapeHtml(p.unit)}</td>
        <td class="col-qty">${qty}</td>
        <td class="col-price">${price.toFixed(2)} €</td>
        <td class="col-total">${(qty * price).toFixed(2)} €</td>
      </tr>`;
  }).join("");

  const htmlContent = `
  <html>
  <head>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        margin: 20px 30px;
        color: #000;
      }

      /* === Logo === */
      .logo-section {
        margin-bottom: 10px;
      }
      .logo-section img {
        max-height: 60px;
        max-width: 200px;
      }

      /* === Header info section === */
      .info-section {
        margin-bottom: 10px;
      }
      .info-section p {
        margin: 2px 0;
        font-size: 12px;
        font-style: italic;
      }
      .info-section strong {
        font-style: italic;
      }

      /* === Centered title block === */
      .title-block {
        text-align: center;
        margin: 15px 0 10px;
      }
      .title-block h1 {
        font-size: 16px;
        font-weight: bold;
        margin: 5px 0;
      }
      .title-block h2 {
        font-size: 14px;
        font-weight: bold;
        margin: 3px 0;
      }
      .title-block h3 {
        font-size: 13px;
        font-weight: bold;
        margin: 3px 0;
      }

      /* === Protocol text === */
      .protocol-text {
        text-align: center;
        font-style: italic;
        font-size: 11px;
        margin: 10px 20px 15px;
        line-height: 1.5;
      }

      /* === Products table === */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 11px;
      }
      th {
        background-color: #d9d9d9;
        border: 1px solid #000;
        padding: 6px 4px;
        text-align: center;
        font-weight: bold;
        font-size: 11px;
      }
      td {
        border: 1px solid #000;
        padding: 5px 4px;
        font-size: 11px;
      }
      .col-num { text-align: center; width: 30px; }
      .col-name { text-align: left; padding-left: 6px; }
      .col-unit { text-align: center; width: 65px; }
      .col-qty { text-align: center; width: 50px; }
      .col-price { text-align: right; padding-right: 6px; width: 80px; }
      .col-total { text-align: right; padding-right: 6px; width: 90px; }

      /* === Summary rows inside table === */
      .summary-row td {
        border: none;
        padding: 3px 6px;
        font-size: 12px;
      }
      .summary-label {
        text-align: right;
        font-weight: bold;
        padding-right: 8px !important;
      }
      .summary-value {
        text-align: right;
        font-weight: bold;
        padding-right: 6px !important;
      }
      .summary-smr .summary-value {
        background-color: #ffffcc;
        color: #c00;
      }
      .summary-vat .summary-value {
        background-color: #ffffcc;
        color: #c00;
      }
      .summary-total .summary-value {
        background-color: #ffffcc;
        color: #c00;
      }

      /* === Signature section === */
      .signature-container {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
      }
      .signature-box {
        width: 45%;
        text-align: center;
      }
      .signature-box p {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 12px;
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
    <!-- Logo -->
    ${logoBase64 ? `<div class="logo-section"><img src="${logoBase64}" alt="Logo" /></div>` : ""}

    <!-- Info section: Възложител, Изпълнител, Обект (above the title) -->
    <div class="info-section">
      <p><strong>Възложител:</strong> ${escapeHtml(clientInfo.contractor)}</p>
      <p><strong>Изпълнител:</strong> ${escapeHtml(clientInfo.executor)}</p>
      <p><strong>Обект:</strong> ${escapeHtml(clientInfo.object)}</p>
    </div>

    <!-- Centered title block -->
    <div class="title-block">
      <h1>${escapeHtml(clientInfo.protocolTitle)}</h1>
      <h2>${escapeHtml(clientInfo.protocolNumber)}</h2>
      <h3>${escapeHtml(clientInfo.completionText)}</h3>
    </div>

    <!-- Protocol text (italic, centered) -->
    <div class="protocol-text">
      ${escapeHtml(protocolText)}
    </div>

    <!-- Products table -->
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Видове работа</th>
          <th>Ед.мярка</th>
          <th>К-во</th>
          <th>Ед.цена</th>
          <th>Цена</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
        <!-- Summary rows inside the table -->
        <tr class="summary-row summary-smr">
          <td colspan="4"></td>
          <td class="summary-label">Общо СМР:</td>
          <td class="summary-value">${totalAmount.toFixed(2)} €</td>
        </tr>
        <tr class="summary-row summary-vat">
          <td colspan="4"></td>
          <td class="summary-label">ДДС:</td>
          <td class="summary-value">${vatAmount.toFixed(2)} €</td>
        </tr>
        <tr class="summary-row summary-total">
          <td colspan="4"></td>
          <td class="summary-label">Всичко:</td>
          <td class="summary-value">${grandTotal.toFixed(2)} €</td>
        </tr>
      </tbody>
    </table>

    <!-- Signature section -->
    <div class="signature-container">
      <div class="signature-box">
        <p>За Възложителя:</p>
        <span class="signature-line"></span>
        <p>/ ${escapeHtml(clientInfo.clientSignature) || ".........................."} /</p>
      </div>
      <div class="signature-box">
        <p>За Изпълнителя:</p>
        <span class="signature-line"></span>
        <p>/ ${escapeHtml(clientInfo.executorSignature) || ".........................."} /</p>
      </div>
    </div>
  </body>
  </html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: chromium.headless,
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    return pdfBuffer;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generatePDF };
