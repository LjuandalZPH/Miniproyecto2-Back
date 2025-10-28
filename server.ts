/**
 * @fileoverview Punto de entrada principal del servidor Express.
 * Configura middlewares, rutas y realiza la conexión a la base de datos.
 * 
 * @module server
 */
import dotenv from "dotenv";
import express from "express";
import router from "./api/routes/routes";
import connectDB from "./api/config/database";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
 * Servir archivos de subtítulos (.vtt) con el Content-Type correcto.
 * La carpeta "subtitles" debe existir en la raíz del proyecto (junto a server.ts).
 */
const VTT_DIR = path.join(process.cwd(), "subtitles");
console.log("Serving VTT from:", VTT_DIR);

app.use(
  "/subtitles",
  express.static(VTT_DIR, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".vtt")) {
        res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      }
    },
  })
);

/**
 * Ruta principal de prueba.
 */
app.get("/", (_req, res) => {
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