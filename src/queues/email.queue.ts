import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export interface VerificationEmailJob {
    email: string;
    OTP: string;
    userId: string;
}

export interface WelcomeEmailJob {
    email: string;
    name: string;
}

export interface LoginNotificationJob {
    email: string;
    name: string;
}

// Create email queue
export const emailQueue = new Queue('email', {
    connection: createRedisConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 1000, 
        },
        removeOnFail: {
            age: 7 * 24 * 3600,
        },
    },
});

// Helper functions to add jobs
export const sendVerificationEmail = async (data: VerificationEmailJob) => {
    return await emailQueue.add('verification', data, {
        priority: 1, 
    });
};

export const sendWelcomeEmail = async (data: WelcomeEmailJob) => {
    return await emailQueue.add('welcome', data, {
        priority: 2, 
    });
};

export const sendLoginNotification = async (data: LoginNotificationJob) => {
    return await emailQueue.add('login-notification', data, {
        priority: 3, 
    });
};