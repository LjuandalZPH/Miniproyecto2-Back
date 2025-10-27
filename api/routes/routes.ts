/**
 * Root API router.
 * Mounts domain routes (users, auth, movies), integrations (Pexels),
 * and utilities (auto subtitles).
 */

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
import autoSubtitlesRouter from "./autoSubtitles.routes";

const router = express.Router();

/* -----------------------------------------
   Users CRUD
----------------------------------------- */
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

/* -----------------------------------------
   Authentication
----------------------------------------- */
router.post("/login", loginUser);

/* -----------------------------------------
   Profile (Requires JWT)
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
   Password Recovery
----------------------------------------- */
router.post("/users/recover-password", recoverPassword);
router.post("/users/reset-password", resetPassword);

/* -----------------------------------------
   User Favorites
----------------------------------------- */
router.patch("/users/:userId/favorites/:movieId", verifyToken, toggleFavorite);
router.get("/users/:userId/favorites", verifyToken, getFavorites);

/* -----------------------------------------
   External/Feature Routers
----------------------------------------- */
router.use("/pexels", pexelsRouter);
router.use("/movies", moviesRouter);

/* -----------------------------------------
   Subtitles (auto-generation endpoints)
----------------------------------------- */
router.use("/subtitles", autoSubtitlesRouter);

export default router;