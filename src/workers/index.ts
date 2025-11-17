import { emailWorker } from './email.worker';

export const startWorkers = () => {
    console.log('🚀 Starting workers...');
};

// Graceful shutdown
export const shutdownWorkers = async () => {
    console.log('🛑 Shutting down workers...');
    await emailWorker.close();
    console.log('✅ Workers shut down successfully');
};

// Handle process termination
process.on('SIGTERM', shutdownWorkers);
process.on('SIGINT', shutdownWorkers);