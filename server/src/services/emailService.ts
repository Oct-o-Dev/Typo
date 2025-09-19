import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: '"TypoRival" <no-reply@typorival.com>',
    to: to,
    subject: 'Your TypoRival Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
        <h2 style="color: #4A90E2;">Welcome to TypoRival!</h2>
        <p>Your one-time verification code is below.</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; color: #E27D60;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️  OTP email sent to ${to}`);
};
