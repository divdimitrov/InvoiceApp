const express = require("express");
const cors = require("cors");
const pdfRoutes = require("./routes/pdfRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/export", pdfRoutes);

app.listen(5000, () => console.log("✅ Server running on port 5000"));
