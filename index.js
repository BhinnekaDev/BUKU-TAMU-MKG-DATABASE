require("dotenv").config();
const express = require("express");
const pool = require("@/db");
require("module-alias/register");

const app = express();
app.use(express.json());

// Import route
const adminRoutes = require("@/routes/adminRoutes");
const pengunjungRoutes = require("@/routes/pengunjungRoutes");

// Gunakan route
app.use("/admin", adminRoutes);
app.use("/pengunjung", pengunjungRoutes);

app.get("/", (req, res) => {
  res.send("API server aktif!");
});

module.exports = app;
