import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  recoverPassword,
  resetPassword,
  toggleFavorite,
  getFavorites
} from "../controller/user.controller";
import { loginUser } from "../controller/auth.controller";
import { verifyToken } from "../middlewares/auth";
import User from "../models/users";
import pexelsRouter from "./pexels.routes";
import moviesRouter from "./movies.routes";

const router = express.Router();

/* -----------------------------------------
   👤 CRUD DE USUARIOS
----------------------------------------- */
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

/* -----------------------------------------
   🔐 AUTENTICACIÓN
----------------------------------------- */
router.post("/login", loginUser);

/* -----------------------------------------
   🧩 PERFIL (Requiere token JWT)
----------------------------------------- */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
});

/* -----------------------------------------
   🔑 RECUPERACIÓN DE CONTRASEÑA
----------------------------------------- */
router.post("/users/recover-password", recoverPassword);
router.post("/users/reset-password", resetPassword);

/* -----------------------------------------
   ❤️ FAVORITOS DE USUARIO
----------------------------------------- */
// Añadir o eliminar película de favoritos
router.patch("/users/:userId/favorites/:movieId", verifyToken, toggleFavorite);

// Obtener todas las películas favoritas del usuario
router.get("/users/:userId/favorites", verifyToken, getFavorites);

/* -----------------------------------------
   🎬 RUTAS DE OTROS MÓDULOS
----------------------------------------- */
router.use("/pexels", pexelsRouter);

//ruta movies
router.use("/movies", moviesRouter);

export default router;

