import express from "express";
import usersController from "../controller/users.controller.js";
import authUser from "../auth/checkAuth.js"
import { forgotPasswordLimiter, loginLimiter, refreshTokenLimiter, resetPasswordLimiter } from "../middlewares/rateLimit.js";
const router = express.Router();

router.post("/sign-up", usersController.register);
router.post("/sign-in", loginLimiter, usersController.login);
// router.post("/auth", authUser, usersController.authUser);
router.post("/refresh-token", refreshTokenLimiter, usersController.refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, usersController.forgotPassword);
router.post("/reset-password", resetPasswordLimiter, usersController.resetPassword);

export default router;
