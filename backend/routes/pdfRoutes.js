const express = require("express");
const { exportPDF } = require("../controllers/pdfController");

const router = express.Router();

router.post("/pdf", exportPDF);

module.exports = router;
