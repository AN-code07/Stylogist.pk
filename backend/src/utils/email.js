import nodemailer from 'nodemailer';
import env from '../config/env.js';

export const sendEmail = async (options) => {
  // 1. Create a transporter (Use Mailtrap for dev, SendGrid/AWS SES for prod)
  const transporter = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    auth: {
      user: env.emailUser,
      pass: env.emailPass,
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: 'Stylogist Admin <support@HarbalMart.pk>',
    to: options.email,
    subject: options.subject,
    html: options.message,
    // html: options.html // (Optional: Add HTML template here)
  };

  // 3. Send email
  await transporter.sendMail(mailOptions);
};