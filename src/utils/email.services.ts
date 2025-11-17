import { transport } from '../middleware/send-mail';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send email directly (without queue)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const info = await transport.sendMail({
      from: `"Slate App" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return info.accepted.includes(options.to);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

/**
 * Send verification code email
 */
export const sendVerificationEmail = async (email: string, OTP: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Account Verification Code',
    text: `Your account verification one-time password is ${OTP}. This code will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
          ${OTP}
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
      </div>
    `,
  });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Slate App!',
    text: `Hi ${name}, your account has been created successfully!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Slate App!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully. We're excited to have you on board!</p>
      </div>
    `,
  });
};

/**
 * Send login notification email
 */
export const sendLoginNotification = async (email: string, name: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Login Notification',
    text: `Hi ${name}, a login to your account was successful.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Login Notification</h2>
        <p>Hi ${name},</p>
        <p>A login to your account was successful at ${new Date().toLocaleString()}.</p>
        <p style="color: #666; font-size: 14px;">If this wasn't you, please secure your account immediately.</p>
      </div>
    `,
  });
};