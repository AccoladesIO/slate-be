import { Redis } from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

export const createRedisConnection = () => new Redis(redisConfig);

export const testRedisConnection = async () => {
    const redis = createRedisConnection();
    try {
        await redis.ping();
        console.log('✅ Redis connection successful');
        redis.disconnect();
        return true;
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        return false;
    }
};