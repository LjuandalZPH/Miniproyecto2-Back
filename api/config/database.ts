/**
 * @fileoverview Configuración y conexión a la base de datos MongoDB usando Mongoose.
 * Este módulo exporta una función para conectar a MongoDB Atlas y gestiona el cierre limpio de la conexión.
 * 
 * @module api/config/database
 */

import mongoose from "mongoose";

/**
 * Conecta la aplicación a la base de datos MongoDB Atlas usando la URI definida en las variables de entorno.
 * Si la variable de entorno MONGO_URI no está definida, termina el proceso con error.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Promesa que se resuelve cuando se establece la conexión o se rechaza si hay error.
 * 
 * @throws Termina el proceso si no puede conectar a la base de datos.
 */
const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error("Error: MONGO_URI no está definida en las variables de entorno.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("Conectado a MongoDB Atlas");
  } catch (error: any) {
    console.error("Error al conectar a MongoDB Atlas:", error.message);
    process.exit(1);
  }
};

/**
 * Middleware para cerrar la conexión a MongoDB cuando la aplicación recibe SIGINT (Ctrl+C).
 * Útil para liberar recursos correctamente al finalizar la aplicación.
 */
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Conexión a MongoDB cerrada por SIGINT");
  process.exit(0);
});

export default connectDB;