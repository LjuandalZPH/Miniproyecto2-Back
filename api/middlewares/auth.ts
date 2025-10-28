import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * JWT secret used to sign and verify tokens.
 * Falls back to a default string if `process.env.JWT_SECRET` is not provided.
 * Note: using a default secret is insecure in production; set the environment
 * variable for deployed environments.
 * @constant {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

/**
 * Express middleware that verifies a Bearer JWT in the Authorization header.
 *
 * Expected header: `Authorization: Bearer <token>`
 * On success, sets `req.user` to the decoded token payload and calls `next()`.
 * On failure, responds with 403 if missing token or 401 if token is invalid/expired.
 *
 * This middleware does not throw — it always sends an HTTP response or calls
 * `next()` when the request is allowed to continue.
 *
 * @param {Request} req - Express request object. When successful, `req.user` is populated.
 * @param {Response} res - Express response object used to send errors.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {void}
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(403).json({ message: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
