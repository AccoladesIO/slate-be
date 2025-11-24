import { Request, Response, NextFunction } from 'express';
import { signinSchema, signupSchema, validationCodeSchema } from '../middleware/validator';
import { User } from '../models';
import { doHash, doHashValidation, hmacProcess } from '../utils/hashing';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendWelcomeEmail, sendLoginNotification } from '../utils/email.services';

interface SignupRequestBody {
    email: string;
    name: string;
    password: string;
}

const isProduction = process.env.NODE_ENV === "production";

export const SignupController = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
    const { email, name, password } = req.body;

    try {
        const { error } = signupSchema.validate({ email, name, password });
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const existingUser = await User.findOne({ where: { email }, attributes: ['id'] });
        if (existingUser) return res.status(409).json({ success: false, message: 'Account exists' });

        const hashedPassword = await doHash(password, 12);
        const newUser = await User.create({ name, email, password: hashedPassword, verified: false });

        sendWelcomeEmail(newUser.email, newUser.name).catch(console.error);

        return res.status(201).json({ success: true, message: 'Account created', data: { id: newUser.id, email: newUser.email, name: newUser.name } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const LoginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const { error } = signinSchema.validate({ email, password });
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'Invalid credentials' });

        const valid = await doHashValidation(password, user.password);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET_KEY!, { expiresIn: '8h' });

        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: 8 * 3600 * 1000,
        });

        sendLoginNotification(user.email, user.name).catch(console.error);

        return res.status(200).json({ success: true, message: 'Login successful', data: { id: user.id, email: user.email, name: user.name, verified: user.verified } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const SignOutController = async (req: Request, res: Response) => {
    res.clearCookie("token", { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", path: "/" })
       .status(200).json({ success: true, message: 'Signout successful' });
};

export const sendAccountVerificationCodeController = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(401).json({ success: false, message: 'Email missing' });

        const user = await User.findOne({ where: { email }, attributes: ['id', 'email', 'verified'] });
        if (!user) return res.status(404).json({ success: false, message: 'Account does not exist' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const hashCode = await hmacProcess(OTP, process.env.HMAC_SECRET_KEY!);

        await User.update({ verificationCode: hashCode, verificationCodeValidation: new Date().toISOString() }, { where: { id: user.id } });

        sendVerificationEmail(user.email, OTP).catch(console.error);

        return res.status(200).json({ success: true, message: 'Verification code sent' });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to send code', error: error.message });
    }
};

export const verifyAccountVerificationCodeController = async (req: Request, res: Response) => {
    const { email, code } = req.body;

    try {
        const { error } = validationCodeSchema.validate({ email, code });
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'Incorrect credentials' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });

        if (!user.verificationCode || !user.verificationCodeValidation) return res.status(400).json({ success: false, message: 'No code found' });

        const expiration = new Date(user.verificationCodeValidation).getTime() + 5 * 60 * 1000;
        if (Date.now() > expiration) return res.status(400).json({ success: false, message: 'Code expired' });

        const hashCode = await hmacProcess(code, process.env.HMAC_SECRET_KEY!);
        if (hashCode !== user.verificationCode) return res.status(400).json({ success: false, message: 'Invalid OTP' });

        user.verified = true;
        user.verificationCode = null;
        user.verificationCodeValidation = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Account verified' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const MeController = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
        const user = await User.findByPk(decoded.id, { attributes: ['id', 'email', 'name', 'verified'] });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.status(200).json({ success: true, message: 'User fetched', data: user });

    } catch (err) {
        return res.status(401).json({ success: false, message: 'Session expired' });
    }
};

// ---------- Password Reset Controllers ----------

export const sendForgotPasswordCodeController = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ success: false, message: 'Email missing' });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'Account does not exist' });

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const hashCode = await hmacProcess(OTP, process.env.HMAC_SECRET_KEY!);

        await User.update({ verificationCode: hashCode, verificationCodeValidation: new Date().toISOString() }, { where: { id: user.id } });

        sendVerificationEmail(user.email, OTP).catch(console.error);

        return res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const verifyForgotPasswordCodeController = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    try {
        if (!email || !code || !newPassword) return res.status(400).json({ success: false, message: 'Missing parameters' });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'Invalid credentials' });

        const expiration = new Date(user.verificationCodeValidation!).getTime() + 5 * 60 * 1000;
        if (Date.now() > expiration) return res.status(400).json({ success: false, message: 'OTP expired' });

        const hashCode = await hmacProcess(code, process.env.HMAC_SECRET_KEY!);
        if (hashCode !== user.verificationCode) return res.status(400).json({ success: false, message: 'Invalid OTP' });

        user.password = await doHash(newPassword, 12);
        user.verificationCode = null;
        user.verificationCodeValidation = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const ChangePasswordController = async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const token = req.cookies.token;

    try {
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const valid = await doHashValidation(oldPassword, user.password);
        if (!valid) return res.status(401).json({ success: false, message: 'Old password incorrect' });

        user.password = await doHash(newPassword, 12);
        await user.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
