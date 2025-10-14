import nodemailer from "nodemailer";

/**
 * Envía un correo de recuperación de contraseña con el token.
 * @param {string} email - El email del usuario
 * @param {string} token - El token de recuperación
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