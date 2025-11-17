"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controller/authController");
const router = express_1.default.Router();
router.post('/signup', authController_1.SignupController);
router.post("/login", authController_1.LoginController);
router.post('/send-verification-code', authController_1.sendAccountVerificationCodeController);
router.patch('verify-account', authController_1.verifyAccountVerificationCodeController);
router.post("forgot-password", authController_1.sendForgotPasswordCodeController);
router.patch("verify-forgot-password-code", authController_1.verifyForgotPasswordCodeController);
router.patch("/change-password", authController_1.ChangePasswordController);
exports.default = router;
