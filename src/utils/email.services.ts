import { transport } from '../middleware/send-mail';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const info = await transport.sendMail({
      from: `"Slate App" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}`);
    return info.accepted.includes(options.to);
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, OTP: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Verify Your Slate App Account',
    text: `Your verification code is ${OTP}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #eee;">
        <h2 style="text-align: center; color: #6a00ff;">Verify Your Account</h2>
        <p style="color: #555; font-size: 16px; margin-top: 20px;">Use the verification code below to complete your account setup:</p>
        <div style="background: #f7f2ff; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #6a00ff;">${OTP}</span>
        </div>
        <p style="font-size: 14px; color: #999;">This code expires in 5 minutes.</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Slate App 🎉',
    text: `Hi ${name}, welcome to Slate App!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #eee;">
        <h2 style="text-align: center; color: #6a00ff;">Welcome to Slate App 🎉</h2>
        <p style="font-size: 16px; color: #333; margin-top: 20px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #555;">Your account has been created successfully. We're excited to have you onboard!</p>
        <div style="background: #f7f2ff; padding: 20px; border-radius: 10px; margin-top: 25px;">
          <p style="color: #6a00ff; font-size: 16px; text-align: center;">Start creating, presenting, and collaborating with ease.</p>
        </div>
      </div>
    `,
  });
};

export const sendLoginNotification = async (email: string, name: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: 'Slate App Login Alert',
    text: `Hi ${name}, a login to your account was detected.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #eee;">
        <h2 style="text-align: center; color: #6a00ff;">Login Notification</h2>
        <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #555;">A login to your Slate App account was recorded on:</p>
        <div style="background: #f7f2ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <p style="color: #6a00ff; font-weight: bold;">${new Date().toLocaleString()}</p>
        </div>
        <p style="font-size: 14px; color: #999;">If this wasn't you, please secure your account immediately.</p>
      </div>
    `,
  });
};

export const sendCollaborationInviteEmail = async (
  to: string,
  sharedBy: string,
  presentationTitle: string,
  accessLevel: string,
  presentationId: string
): Promise<boolean> => {
  const html = `
    <div style="width:100%;padding:40px 0;background:#faf7ff;display:flex;justify-content:center;font-family:Arial,sans-serif;">
      <div style="background:white;width:100%;max-width:600px;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <div style="background:#6a0dad;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:600;">Slate App</h1>
        </div>

        <div style="padding:32px;">
          <h2 style="color:#333;font-size:22px;margin-bottom:10px;">
            You've been invited to collaborate
          </h2>

          <p style="font-size:16px;color:#555;line-height:1.6;">
            <strong>${sharedBy}</strong> just shared a presentation with you.
          </p>

          <div style="margin:20px 0;padding:20px;border:1px solid #eee;border-radius:10px;background:#fdfaff;">
            <p style="margin:0;font-size:16px;color:#333;">
              <strong>Presentation:</strong> ${presentationTitle}
            </p>
            <p style="margin:8px 0 0;font-size:16px;color:#333;">
              <strong>Access Level:</strong> ${accessLevel === 'write' ? 'Can Edit' : 'View Only'}
            </p>
          </div>

          <a href="${process.env.CLIENT_URL}/sharing/${presentationId}" target="_blank" rel="noopener"
            style="display:inline-block;margin-top:20px;padding:14px 26px;background:#6a0dad;color:white;text-decoration:none;font-size:16px;border-radius:8px;">
            Open Presentation
          </a>

          <p style="font-size:13px;color:#888;margin-top:25px;">
            If you weren't expecting this, you can safely ignore this email.
          </p>
        </div>

        <div style="background:#f1e8ff;padding:14px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#6a0dad;">© ${new Date().getFullYear()} Slate App</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'You have been added as a collaborator',
    text: `${sharedBy} has invited you to collaborate on the presentation titled "${presentationTitle}".`,
    html
  });
};
