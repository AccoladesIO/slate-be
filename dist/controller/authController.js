"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordController = exports.verifyForgotPasswordCodeController = exports.sendForgotPasswordCodeController = exports.verifyAccountVerificationCodeController = exports.sendAccountVerificationCodeController = exports.LoginController = exports.SignupController = void 0;
const validator_1 = require("../middleware/validator");
const models_1 = require("../models");
const hashing_1 = require("../utils/hashing");
const send_mail_1 = require("../middleware/send-mail");
const SignupController = async (req, res, next) => {
    const { email, name, password } = req.body;
    try {
        const { error, value } = validator_1.signupSchema.validate({ email, name, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            });
        }
        // Check for an existing user
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exist"
            });
        }
        // Hash Password
        const hashedPassword = await (0, hashing_1.doHash)(password, 12);
        // Create a new User entry
        const newUser = await models_1.User.create({
            name,
            email,
            password: hashedPassword,
            verified: false,
        });
        res.status(201).send({
            success: true,
            message: "Account created successfully!",
            data: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            }
        });
        let info = await send_mail_1.transport.sendMail({
            from: `"Restaurant App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Account Created",
            text: `Your Account has been created successfully!`,
        });
        console.log(info);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "A server error has occured"
            });
        }
    }
};
exports.SignupController = SignupController;
const LoginController = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        res.status(200).send({
            success: true,
            message: "Login successfully!"
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "A server error has occured"
            });
        }
    }
};
exports.LoginController = LoginController;
const sendAccountVerificationCodeController = async (req, res, next) => {
    const { email } = req.body;
    try {
        res.status(200).json({
            success: true,
            message: "Verification OTP sent successfully."
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "A server error occurred"
            });
        }
    }
};
exports.sendAccountVerificationCodeController = sendAccountVerificationCodeController;
const verifyAccountVerificationCodeController = async (req, res, next) => {
    const { email, code } = req.body;
    try {
        res.status(200).json({
            success: true,
            message: "Account verification successful."
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: true,
                message: "A server error occurred."
            });
        }
    }
};
exports.verifyAccountVerificationCodeController = verifyAccountVerificationCodeController;
const sendForgotPasswordCodeController = async (req, res, next) => {
    const { email } = req.body;
    try {
        res.status(200).json({
            status: true,
            message: "OTP sent successfully"
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "An error occured"
            });
        }
    }
};
exports.sendForgotPasswordCodeController = sendForgotPasswordCodeController;
const verifyForgotPasswordCodeController = async (req, res, next) => {
    const { email, code } = req.body;
    try {
        res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "An error occured"
            });
        }
    }
};
exports.verifyForgotPasswordCodeController = verifyForgotPasswordCodeController;
const ChangePasswordController = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    try {
        res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: "An error occured"
            });
        }
    }
};
exports.ChangePasswordController = ChangePasswordController;
