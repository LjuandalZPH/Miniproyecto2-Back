/**
 * @fileoverview Modelo de usuario para MongoDB usando Mongoose.
 * Incluye validaciones de email y contraseña, así como encriptación de contraseña,
 * y campos para recuperación de contraseña.
 * 
 * @module api/models/user
 */

import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

/**
 * Interfaz para el documento de usuario en MongoDB.
 * @interface IUser
 * @property {string} firstName - Nombre del usuario
 * @property {string} lastName - Apellido del usuario
 * @property {number} age - Edad del usuario
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña encriptada del usuario
 * @property {string} [resetPasswordToken] - Token para recuperación de contraseña
 * @property {Date} [resetPasswordExpires] - Fecha de expiración del token
 * @property {function} comparePassword - Método para comparar contraseñas
 */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

/**
 * Expresión regular para validar el formato de email.
 * Ejemplo válido: usuario@dominio.com
 * @constant
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Expresión regular para validar la contraseña.
 * Requiere al menos una minúscula, una mayúscula, un número, un caracter especial y mínimo 8 caracteres.
 * @constant
 */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

/**
 * Esquema Mongoose para el usuario, con validaciones y timestamps.
 * Incluye campos para recuperación de contraseña.
 * @constant
 */
const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [emailRegex, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      match: [passwordRegex, "Password does not meet security requirements"],
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

/**
 * Middleware de Mongoose que encripta la contraseña antes de guardar el usuario.
 * Solo encripta si la contraseña ha sido modificada.
 * @function
 */
UserSchema.pre("save", async function (next) {
  const user = this as IUser;

  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Método del esquema para comparar una contraseña ingresada con la almacenada.
 * @param {string} candidatePassword - Contraseña a comparar
 * @returns {Promise<boolean>} true si la contraseña coincide, false si no
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);