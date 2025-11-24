import express from "express";
import { ChangePasswordController, LoginController,  MeController,  sendAccountVerificationCodeController,  sendForgotPasswordCodeController,  SignupController, verifyAccountVerificationCodeController, verifyForgotPasswordCodeController } from "../controller/authController";
import { authMiddleware } from "../middleware/auth";

const authRouter = express.Router();

authRouter.post('/signup', SignupController)
authRouter.post("/login", LoginController)
authRouter.get("/me", MeController)


// All other routes require authentication
authRouter.use(authMiddleware);
authRouter.post('/send-verification-code', sendAccountVerificationCodeController)
authRouter.patch('/verify-account', verifyAccountVerificationCodeController)

authRouter.post("/forgot-password", sendForgotPasswordCodeController)
authRouter.patch("/verify-forgot-password-code", verifyForgotPasswordCodeController)

authRouter.patch("/change-password", ChangePasswordController)



export default authRouter