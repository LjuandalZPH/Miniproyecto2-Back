import nodemailer from "nodemailer";

/**
 * Mailer utility helpers.
 *
 * This module provides functions to send transactional emails. SMTP
 * credentials are expected to be provided via the environment variables
 * `EMAIL_USER` and `EMAIL_PASS`. The implementation currently uses Gmail's
 * SMTP via `nodemailer.createTransport({ service: 'gmail', auth: { ... } })`.
 */

/**
 * Send a password recovery email containing the provided token.
 *
 * Behavior:
 * - Reads SMTP credentials from `process.env.EMAIL_USER` and `process.env.EMAIL_PASS`.
 * - Constructs a recovery URL using the token and sends a plain-text email
 *   to the specified recipient.
 *
 * Note: The recovery URL is currently hard-coded to
 * `http://localhost:5173/change-password?token=...` — update this value to match
 * your frontend deployment if needed.
 *
 * @param {string} email - Recipient email address.
 * @param {string} token - Recovery token to embed in the recovery link.
 * @returns {Promise<void>} Resolves when the email has been sent.
 */
export async function sendRecoveryEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const recoveryUrl = `http://localhost:5173/change-password?token=${token}`; // Cambia URL según tu frontend
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recuperación de contraseña",
    text: `Para recuperar tu contraseña, haz clic en el siguiente enlace: ${recoveryUrl}`,
  });
}