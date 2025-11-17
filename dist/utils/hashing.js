"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmacProcess = exports.doHashValidation = exports.doHash = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const doHash = async (value, saltRounds) => {
    const salt = await bcryptjs_1.default.genSalt(saltRounds);
    const hash = await bcryptjs_1.default.hash(value, salt);
    return hash;
};
exports.doHash = doHash;
const doHashValidation = async (value, hash) => {
    return bcryptjs_1.default.compare(value, hash);
};
exports.doHashValidation = doHashValidation;
const hmacProcess = async (value, key) => {
    const result = crypto_1.default.createHmac('sha256', key)
        .update(value)
        .digest('hex');
    return result;
};
exports.hmacProcess = hmacProcess;
