require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(toEmail, code) {
  await transporter.sendMail({
    from: `"First Step Ecom" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your email',
    text: `Your verification code is: ${code}`,
  });
}

module.exports = sendVerificationEmail;