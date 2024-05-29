import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email: string, token: string) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

    const verificationUrl = `${process.env.APPLICATION_URL}/verify-email?token=${token}`;
    console.log(verificationUrl);
    
    // return verificationUrl;
//   await transporter.sendMail({
//     from: '"Your App Name" <no-reply@yourapp.com>',
//     to: email,
//     subject: 'Email Verification',
//     html: `Please verify your email by clicking on the following link: <a href="${verificationUrl}">Verify Email</a>`,
//   });
}
