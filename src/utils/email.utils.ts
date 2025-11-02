import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config(); // load env variables

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // e.g., smtp.gmail.com
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Boolean(process.env.SMTP_SECURE) || false, // true if port 465
    auth: {
      user: process.env.SMTP_USER,     // your email
      pass: process.env.SMTP_PASS,     // app password
    },
  });

  await transporter.sendMail({
    from: `"MailCamp" <${process.env.SMTP_USER}>`, // sender
    to,
    subject,
    html,
  });
}

// Function to send verification email
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

  // HTML template
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Verify Your Account</h2>
      <p>Hi there,</p>
      <p>Thank you for registering on <strong>MailCamp</strong>! Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      </p>
      <p>This link will expire in 5 minutes.</p>
      <p>If you did not sign up, please ignore this email.</p>
      <hr />
      <p style="font-size: 12px; color: #888;">MailCamp, HCM</p>
    </div>
  `;

  await sendEmail({ to: email, subject: 'Verify Your Account', html });
}
