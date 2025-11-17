import bcrypt from 'bcryptjs';
import crypto from 'crypto';


export const doHash = async (value: string, saltRounds: number): Promise<string> => {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(value, salt);
    return hash;
};


export const doHashValidation = async (value: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(value, hash);
}

export const hmacProcess = async (value: string, key: string): Promise<string> => {
    const result = crypto.createHmac('sha256', key)
        .update(value)
        .digest('hex');
    return result;
}