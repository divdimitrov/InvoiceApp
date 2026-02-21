const express = require("express");
const cors = require("cors");
const pdfRoutes = require("./routes/pdfRoutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/export", pdfRoutes);

// Health check endpoint
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
