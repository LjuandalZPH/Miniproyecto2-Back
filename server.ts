/**
 * @fileoverview Punto de entrada principal del servidor Express.
 * Configura middlewares, rutas y realiza la conexión a la base de datos.
 * 
 * @module server
 */

import express from "express";
import dotenv from "dotenv";
import router from "./api/routes/routes";
import connectDB from "./api/config/database"; // Importa la función de conexión

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

import cors from "cors";

// allow petitions from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

/**
 * Middleware para parsear JSON en las peticiones.
 */
app.use(express.json());

/**
 * Ruta principal de prueba.
 */
app.get("/", (req, res) => {
  res.send("Everything its working, Rejoice PEASANTS");
});

/**
 * Rutas de la API agrupadas bajo /api.
 */
app.use("/api", router);

/**
 * Conexión a la base de datos MongoDB Atlas.
 */
connectDB();

/**
 * Inicia el servidor en el puerto definido.
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});