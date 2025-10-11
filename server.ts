import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./api/routes/routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas principales
app.get("/", (req, res) => {
  res.send("Everything its working, Rejoice PEASANTS");
});
app.use("/api", router);

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Couldnt connect to MongoDB:", err));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
