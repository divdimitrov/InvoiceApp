const express = require("express");
const cors = require("cors");
const pdfRoutes = require("./routes/pdfRoutes");

require("dotenv").config(); // Зарежда променливите от .env файла

const app = express();
app.use(cors());
app.use(express.json());

app.use("/export", pdfRoutes);

//const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
