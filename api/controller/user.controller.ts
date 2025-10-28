/**
 * @fileoverview Controlador para operaciones sobre usuarios.
 * Incluye métodos CRUD, recuperación de contraseña y manejo de favoritos.
 * 
 * @module api/controller/user.controller
 */

import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/users";
import Movie from "../models/movies"; // Importa el modelo de películas
import { sendRecoveryEmail } from "../utils/mailer";
import bcrypt from "bcryptjs"; 


/**
 * Crear un nuevo usuario
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, age, email, password } = req.body;

    // Validar campos requeridos
    if (!firstName || !lastName || !age || !email || !password) {
      res.status(400).json({ message: "Por favor rellenar todos los campos" });
      return;
    }

    // Verificar si el correo ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Correo ya registrado" });
      return;
    }

    // Crear usuario
    const user = new User({ firstName, lastName, age, email, password });
    await user.save();

    // Preparar respuesta sin contraseña
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      email: user.email,
    };

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: userResponse,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear usuario", error: error.message });
  }
};

/**
 * Obtener todos los usuarios
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, "-password");
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
};

/**
 * Actualizar usuario por ID
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    if (updates.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(updates.email)) {
      res.status(400).json({ message: "Formato de correo inválido" });
      return;
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({
      message: "Usuario actualizado con éxito",
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
};

/**
 * Eliminar usuario por ID
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
  }
};

/**
 * Recuperar contraseña: envía email con token de recuperación
 */
export const recoverPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email requerido" });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ message: "Usuario no encontrado" });
    return;
  }

  // Genera token de recuperación
  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 3600000);

  await user.save();

  // Envía email con token
  await sendRecoveryEmail(user.email, token);

  res.status(200).json({ message: "Correo de recuperación enviado" });
};

/**
 * Resetear contraseña usando el token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ message: "Token y nueva contraseña requeridos" });
    return;
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ message: "Token inválido o expirado" });
    return;
  }

  user.password = newPassword;
  user.markModified("password");
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Contraseña cambiada con éxito" });
};

/* --------------------------------------------------
   🔥 FAVORITOS - Relación Usuario <-> Películas
-------------------------------------------------- */

/**
 * Alternar (añadir o eliminar) una película de los favoritos del usuario
 */
export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, movieId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ message: "Película no encontrada" });
      return;
    }

    // Si no existe la lista de favoritos aún, inicialízala
    if (!user.favorites) user.favorites = [];

    const index = user.favorites.findIndex(
      (fav) => fav.toString() === movieId
    );

    if (index === -1) {
      user.favorites.push(movie._id);
      await user.save();
      res.status(200).json({ message: "Película añadida a favoritos" });
    } else {
      user.favorites.splice(index, 1);
      await user.save();
      res.status(200).json({ message: "Película eliminada de favoritos" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al actualizar favoritos", error: error.message });
  }
};

/**
 * Obtener todas las películas favoritas de un usuario
 */
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("favorites")
      .select("-password");

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({
      message: "Favoritos obtenidos con éxito",
      favorites: user.favorites,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener favoritos", error: error.message });
  }
};
