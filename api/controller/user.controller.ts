// api/controller/user.controller.ts
import { Request, Response } from "express";
import User from "../models/users";

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, age, email, password } = req.body;

    // Validate every input field
    if (!firstName || !lastName || !age || !email || !password) {
      res.status(400).json({ message: "Por favor rellenar todos los campos" });
      return;
    }

    // checks for existing Email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Correo ya registrado" });
      return;
    }

    // Create user
    const user = new User({ firstName, lastName, age, email, password });
    await user.save();

    // dont show password
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      email: user.email,
    };

    res.status(201).json({
      message: "Usuario creado con exito",
      user: userResponse,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear usuario", error: error.message });
  }
};

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, "-password"); // PLEASE DONT SHOW THE PASSWORD, NOT EVEN THE HASH 'KAY? Thanks~!
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

/**
 * Update a user by ID
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // dont allow to change password like this
    delete updates.email;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
