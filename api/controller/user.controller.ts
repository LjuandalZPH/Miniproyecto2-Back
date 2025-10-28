/**
 * @fileoverview User controller.
 *
 * Contains CRUD operations for users, password recovery helpers, and
 * favorites management (user <-> movies relationship).
 *
 * Module: api/controller/user.controller
 */

import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/users";
import Movie from "../models/movies"; // Movie model used for favorites validation
import { sendRecoveryEmail } from "../utils/mailer";
import bcrypt from "bcryptjs"; 


/**
 * Create a new user.
 *
 * Expected payload (req.body): { firstName, lastName, age, email, password }
 * Validates required fields, ensures the email is unique, persists the
 * user and returns a sanitized user object (password excluded) on success.
 *
 * Responses:
 * - 201: User created successfully (returns message and user object)
 * - 400: Missing required fields
 * - 409: Email already registered
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request (body contains user data)
 * @param {Response} res - Express response used to send JSON responses
 * @returns {Promise<void>} Resolves after sending an HTTP response
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
 * Retrieve all users (excluding passwords).
 *
 * Returns an array of users with the `password` field omitted.
 *
 * Responses:
 * - 200: Array of users
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
 * Update a user by ID.
 *
 * Path params: { id }
 * Body: fields to update (email will be ignored by this endpoint).
 *
 * Responses:
 * - 200: User updated successfully (returns message and user object)
 * - 404: User not found
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request (params.id identifies the user)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
 * Delete a user by ID.
 *
 * Path params: { id }
 *
 * Responses:
 * - 200: User deleted
 * - 404: User not found
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request (params.id)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
 * Initiate password recovery for the user identified by email.
 *
 * Body: { email }
 * Behavior:
 * - Validates that email is present.
 * - Finds the user by email; if found, generates a reset token and expiry,
 *   stores them on the user document and sends a recovery email.
 *
 * Responses:
 * - 200: Recovery email sent
 * - 400: Email required
 * - 404: User not found
 *
 * @async
 * @param {Request} req - Express request (body.email)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
 * Reset a user's password using a valid recovery token.
 *
 * Body: { token, newPassword }
 * Behavior:
 * - Validates presence of token and newPassword.
 * - Verifies token exists and has not expired.
 * - Sets the new password, clears reset fields and saves the user.
 *
 * Responses:
 * - 200: Password changed successfully
 * - 400: Missing fields or invalid/expired token
 *
 * @async
 * @param {Request} req - Express request (body.token, body.newPassword)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
  FAVORITES - User <-> Movies relationship
-------------------------------------------------- */

/**
 * Toggle a movie in the user's favorites list (add or remove).
 *
 * Path params: { userId, movieId }
 * Behavior:
 * - Validates that both user and movie exist.
 * - Initializes the favorites array if missing.
 * - Adds the movie if not present, or removes it if already favorited.
 *
 * Responses:
 * - 200: Movie added or removed from favorites
 * - 404: User or movie not found
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request (params.userId, params.movieId)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
 * Get all favorite movies for a user.
 *
 * Path params: { userId }
 * Behavior:
 * - Loads the user, populates the `favorites` field with movie documents
 *   and returns the favorites array (password excluded).
 *
 * Responses:
 * - 200: Favorites returned successfully
 * - 404: User not found
 * - 500: Server error
 *
 * @async
 * @param {Request} req - Express request (params.userId)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
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
