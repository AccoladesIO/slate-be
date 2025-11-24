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

export const SignupController = async (
    req: Request<{}, {}, SignupRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { email, name, password } = req.body;

    try {
        const { error } = signupSchema.validate({ email, name, password });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            where: { email },
            attributes: ['id']
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        // Hash password
        const hashedPassword = await doHash(password, 12);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            verified: false,
        });

        sendWelcomeEmail(newUser.email, newUser.name).catch(err =>
            console.error('Failed to send welcome email:', err)
        );

        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            data: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'A server error has occurred',
        });
    }
};

export const LoginController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, password } = req.body;

    try {
        const { error } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({ where: { email } });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Compare passwords
        const isPasswordValid = await doHashValidation(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate JWT
        const userToken = jwt.sign(
            {
                id: existingUser.id,
                email: existingUser.email,
            },
            process.env.JWT_SECRET_KEY!,
            {
                expiresIn: '8h',
            }
        );

        res.cookie("token", userToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 8 * 3600000,
        });


        sendLoginNotification(existingUser.email, existingUser.name).catch(err =>
            console.error('Failed to send login notification:', err)
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                verified: existingUser.verified,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'A server error has occurred',
        });
    }
};

export const SignOutController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.clearCookie('Authorization').status(200).json({
        success: true,
        message: 'Signout successful',
    });
};

export const sendAccountVerificationCodeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(401).json({
                success: false,
                message: 'Email is missing',
            });
        }

        const existingUser = await User.findOne({
            where: { email },
            attributes: ['id', 'email', 'verified'],
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'An account with this email does not exist',
            });
        }

        if (existingUser.verified) {
            return res.status(400).json({
                success: false,
                message: 'Account is already verified',
            });
        }

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const hashCode = await hmacProcess(OTP, process.env.HMAC_SECRET_KEY!);

        // Update user with verification code
        await User.update(
            {
                verificationCode: hashCode,
                verificationCodeValidation: new Date().toISOString(),
            },
            { where: { id: existingUser.id } }
        );

        sendVerificationEmail(existingUser.email, OTP).catch(err =>
            console.error('Failed to send verification email:', err)
        );

        // Return immediately
        return res.status(200).json({
            success: true,
            message: 'Verification code is being sent to your email.',
        });

    } catch (error: any) {
        console.error('Verification code error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification code. Please try again later.',
            error: error.message,
        });
    }
};

export const verifyAccountVerificationCodeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, code } = req.body;

    try {
        const { error } = validationCodeSchema.validate({ email, code });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and code are required',
            });
        }

        const isUserExist = await User.findOne({ where: { email } });
        if (!isUserExist) {
            return res.status(404).json({
                success: false,
                message: 'Incorrect credentials',
            });
        }

        if (isUserExist.verified) {
            return res.status(400).json({
                success: false,
                message: 'User is already verified',
            });
        }

        if (!isUserExist.verificationCode || !isUserExist.verificationCodeValidation) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found',
            });
        }

        const expirationTime = new Date(isUserExist.verificationCodeValidation).getTime() + 5 * 60 * 1000;
        if (Date.now() > expirationTime) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired.',
            });
        }

        const hashCode = await hmacProcess(code.toString(), process.env.HMAC_SECRET_KEY!);
        if (hashCode !== isUserExist.verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        // Mark as verified
        isUserExist.verified = true;
        isUserExist.verificationCode = null;
        isUserExist.verificationCodeValidation = null;
        await isUserExist.save();

        return res.status(200).json({
            success: true,
            message: 'Account verification successful.',
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'A server error occurred.',
        });
    }
};

export const sendForgotPasswordCodeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email } = req.body;

    try {
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred',
        });
    }
};

export const verifyForgotPasswordCodeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, code } = req.body;

    try {
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred',
        });
    }
};

export const ChangePasswordController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { oldPassword, newPassword } = req.body;

    try {
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred',
        });
    }
};


export const MeController = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
        const user = await User.findByPk(decoded.id, { attributes: ['id', 'email', 'name', 'verified'] });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.status(200).json({ success: true, message: 'User fetched', data: user });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Session expired' });
    }
};
