import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/users";

/**
 * JSON Web Token secret used to sign authentication tokens.
 * Falls back to a default string when `process.env.JWT_SECRET` is not set.
 *
 * Note: Using a default secret is insecure for production. Ensure
 * `JWT_SECRET` is set in the environment for deployed environments.
 * @constant {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

/**
 * Authenticate a user and issue a JWT.
 *
 * Workflow:
 * 1. Validate that `email` and `password` are present in the request body.
 * 2. Look up the user by email. If not found, return 401 Unauthorized.
 * 3. Compare the provided password with the stored hashed password using bcrypt.
 * 4. If valid, sign a JWT containing the user's id and email and return it with user info.
 * 5. On any unexpected error, return 500 Internal Server Error with a message.
 *
 * @async
 * @param {Request} req - Express request object. Expects `email` and `password` in `req.body`.
 * @param {Response} res - Express response object used to send status and JSON payloads.
 * @returns {Promise<void>} Resolves after sending a response. Does not throw — errors are handled and returned as responses.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
