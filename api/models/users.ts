/**
 * @fileoverview User model for MongoDB using Mongoose.
 *
 * The schema includes validation for email and password strength, automatic
 * password hashing, fields for password recovery, and a favorites array that
 * references the `Movie` collection.
 *
 * Module: api/models/user
 */

import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

/**
 * Interface for the User document in MongoDB.
 *
 * @interface IUser
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {number} age - User's age
 * @property {string} email - User's email (unique, lowercased)
 * @property {string} password - Hashed password
 * @property {string} [resetPasswordToken] - Optional token used for password recovery
 * @property {Date} [resetPasswordExpires] - Optional token expiry date
 * @property {mongoose.Types.ObjectId[]} favorites - Array of Movie ObjectIds
 * @property {(candidatePassword: string) => Promise<boolean>} comparePassword - Method to compare plaintext password with hash
 */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  favorites: mongoose.Types.ObjectId[];
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

/**
 * Format validation regular expressions.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;

/**
 * Mongoose schema for the User collection.
 *
 * Fields:
 * - firstName, lastName: required strings
 * - age: required number (min 0)
 * - email: required, unique, validated against `emailRegex`
 * - password: required, validated against `passwordRegex` (stored hashed)
 * - resetPasswordToken/resetPasswordExpires: optional recovery fields
 * - favorites: array of ObjectId references to the `Movie` model
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

    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

/**
 * Pre-save middleware to hash the password when it has been modified.
 * Uses bcrypt with a salt rounds of 10.
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
 * Instance method to compare a candidate plaintext password with the stored hash.
 * Returns a promise that resolves to `true` when passwords match.
 *
 * @param {string} candidatePassword - Plaintext password to compare
 * @returns {Promise<boolean>} Whether the provided password matches the stored hash
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Default export: Mongoose model for the User collection.
 */
export default mongoose.model<IUser>("User", UserSchema);
