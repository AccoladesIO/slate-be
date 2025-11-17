import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { transport } from '../middleware/send-mail';
import { VerificationEmailJob, WelcomeEmailJob, LoginNotificationJob } from '../queues/email.queue';

const emailTemplates = {
    verification: (OTP: string) => ({
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
    }),

    welcome: (name: string) => ({
        subject: 'Welcome to Slate App!',
        text: `Hi ${name}, your account has been created successfully!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Slate App!</h2>
                <p>Hi ${name},</p>
                <p>Your account has been created successfully. We're excited to have you on board!</p>
            </div>
        `,
    }),

    loginNotification: (name: string) => ({
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
    }),
};

// Create email worker
export const emailWorker = new Worker(
    'email',
    async (job: Job) => {
        console.log(`📧 Processing ${job.name} email job #${job.id}`);

        try {
            let emailContent;
            let recipientEmail: string;

            switch (job.name) {
                case 'verification': {
                    const data = job.data as VerificationEmailJob;
                    emailContent = emailTemplates.verification(data.OTP);
                    recipientEmail = data.email;
                    break;
                }

                case 'welcome': {
                    const data = job.data as WelcomeEmailJob;
                    emailContent = emailTemplates.welcome(data.name);
                    recipientEmail = data.email;
                    break;
                }

                case 'login-notification': {
                    const data = job.data as LoginNotificationJob;
                    emailContent = emailTemplates.loginNotification(data.name);
                    recipientEmail = data.email;
                    break;
                }

                default:
                    throw new Error(`Unknown job type: ${job.name}`);
            }

            // Send email
            const info = await transport.sendMail({
                from: `"Slate App" <${process.env.EMAIL_USER}>`,
                to: recipientEmail,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html,
            });

            if (!info.accepted.includes(recipientEmail)) {
                throw new Error('Email not accepted by server');
            }

            console.log(`✅ ${job.name} email sent to ${recipientEmail}`);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error(`❌ Failed to send ${job.name} email:`, error);
            throw error; // This will trigger retry logic
        }
    },
    {
        connection: createRedisConnection(),
        concurrency: 5, // Process 5 emails simultaneously
        limiter: {
            max: 10, // Max 10 jobs
            duration: 1000, // Per 1 second (rate limiting)
        },
    }
);

// Worker event listeners
emailWorker.on('completed', (job: Job, result: any) => {
    console.log(`✅ Job #${job.id} completed successfully`);
});

emailWorker.on('failed', (job: Job | undefined, err: Error, prev: string) => {
    console.error(`❌ Job #${job?.id ?? 'unknown'} failed:`, err.message);
});

emailWorker.on('error', (err: {message: string}) => {
    console.error('❌ Worker error:', err);
});

console.log('👷 Email worker started');