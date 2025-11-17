"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForgotPasswordCodeSchema = exports.changePasswordSchema = exports.validationCodeSchema = exports.signinSchema = exports.signupSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.signupSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    password: joi_1.default.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'))
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8–64 characters long.',
    }),
    name: joi_1.default.string().required()
});
exports.signinSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    password: joi_1.default.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'))
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8–64 characters long.',
    }),
});
exports.validationCodeSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    code: joi_1.default.number()
        .required(),
});
exports.changePasswordSchema = joi_1.default.object({
    newPassword: joi_1.default.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$')),
    oldPassword: joi_1.default.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'))
});
exports.validateForgotPasswordCodeSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    code: joi_1.default.number()
        .required(),
    newPassword: joi_1.default.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$')),
});
