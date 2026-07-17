import nodemailer from "nodemailer";
import { CONSTANTS } from "../config/constant";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: CONSTANTS.SMTP_HOST,
      port: CONSTANTS.SMTP_PORT,
      secure: CONSTANTS.SMTP_PORT === 465,
      auth: CONSTANTS.SMTP_USER
        ? { user: CONSTANTS.SMTP_USER, pass: CONSTANTS.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
};

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!CONSTANTS.SMTP_HOST) {
    throw new Error("SMTP is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env");
  }

  await getTransporter().sendMail({
    from: CONSTANTS.SMTP_FROM,
    to,
    subject,
    html,
  });
};
