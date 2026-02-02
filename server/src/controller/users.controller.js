import { sendMailForgotPassword } from "../utils/sendMailForgotPassword.js";
import {
    createToken,
    createRefreshToken,
    createApiKey,
    verifyToken
} from "../services/tokenServices.js";

import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";

// TODO: đảm bảo các model này đã import đúng
import modelUser from "../models/users.model.js";
import modelOtp from "../models/otp.model.js";
import modelApiKey from "../models/apiKey.model.js";
import { verifyCaptcha } from "../utils/verifyCaptcha .js";

class UsersController {

    async register(req, res) {
        try {
            const { fullName, email, password, captchaToken } = req.body;
            if (!captchaToken) {
                return res.status(400).json({ message: "Thiếu captcha" });
            }
            const isCaptchaValid = await verifyCaptcha(captchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ message: "Captcha không hợp lệ" });
            }
            if (!fullName || !email || !password) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
            }

            const user = await modelUser.findOne({ email });
            if (user) {
                return res.status(400).json({ message: "Người dùng đã tồn tại" });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = await modelUser.create({
                fullName,
                email,
                password: passwordHash
            });

            await createApiKey(newUser._id);

            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });

            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 15 * 60 * 1000,
            });

            res.cookie("logged", 1, {
                secure: false,
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(201).json({
                message: "Đăng ký thành công",
                token,
                refreshToken
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

    async login(req, res) {
        try {
            const { email, password, captchaToken } = req.body;
            if (!captchaToken) {
                return res.status(400).json({ message: "Thiếu captcha" });
            }

            const isCaptchaValid = await verifyCaptcha(captchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ message: "Captcha không hợp lệ" });
            }
            const user = await modelUser.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Email hoặc mật khẩu không chính xác" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Email hoặc mật khẩu không chính xác" });
            }
            const existedKey = await modelApiKey.findOne({ userId: user._id });

            if (!existedKey) {
                await createApiKey(user._id);
            }
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });

            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 15 * 60 * 1000,
            });

            res.cookie("logged", 1, {
                secure: false,
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user,
                refreshToken
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

    async authUser(req, res) {
        try {
            const user = await modelUser.findById(req.user.id);
            if (!user) {
                return res.status(401).json({ message: "Không tìm thấy người dùng" });
            }

            const auth = CryptoJS.AES.encrypt(
                JSON.stringify(user),
                process.env.SECRET_CRYPTO
            ).toString();

            return res.status(200).json({ auth });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ message: "Không có refresh token" });
            }

            const decoded = await verifyToken(refreshToken);
            const user = await modelUser.findById(decoded.id);

            const token = await createToken({ id: user._id });

            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 15 * 60 * 1000,
            });

            res.cookie("logged", 1, {
                secure: false,
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                message: "Refresh token thành công",
                token
            });

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: "Refresh token không hợp lệ" });
        }
    }

    async logout(req, res) {
        try {
            await modelApiKey.deleteOne({ userId: req.user.id });

            res.clearCookie("token");
            res.clearCookie("refreshToken");
            res.clearCookie("logged");

            return res.status(200).json({ message: "Đăng xuất thành công" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

    async getUsers(req, res) {
        const users = await modelUser.find();
        return res.status(200).json(users);
    }

    async forgotPassword(req, res) {
        try {
            const { email, captchaToken } = req.body;
            if (!captchaToken) {
                return res.status(400).json({ message: "Thiếu captcha" });
            }

            const isCaptchaValid = await verifyCaptcha(captchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ message: "Captcha không hợp lệ" });
            }
            if (!email) {
                return res.status(400).json({ message: "Vui lòng nhập email" });
            }

            const user = await modelUser.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "Email không tồn tại" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            const otp = otpGenerator.generate(6, {
                digits: true,
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });

            const hash = await bcrypt.hash(otp, 10);

            await modelOtp.create({ email, otp: hash });
            await sendMailForgotPassword(email, otp);

            res.cookie("tokenResetPassword", token, {
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                maxAge: 15 * 60 * 1000,
            });

            return res.status(200).json({ message: "Đã gửi OTP" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

    async resetPassword(req, res) {
        try {
            const { otp, newPassword, captchaToken } = req.body;
            const token = req.cookies.tokenResetPassword;
            if (!captchaToken) {
                return res.status(400).json({ message: "Thiếu captcha" });
            }

            const isCaptchaValid = await verifyCaptcha(captchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ message: "Captcha không hợp lệ" });
            }
            if (!token) {
                return res.status(401).json({ message: "Token không hợp lệ" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const otpRecord = await modelOtp.findOne({ email: decoded.email });
            if (!otpRecord) {
                return res.status(400).json({ message: "OTP không hợp lệ" });
            }

            const isMatch = await bcrypt.compare(otp, otpRecord.otp);
            if (!isMatch) {
                return res.status(400).json({ message: "OTP không đúng" });
            }

            const passwordHash = await bcrypt.hash(newPassword, 10);
            await modelUser.updateOne(
                { email: decoded.email },
                { password: passwordHash }
            );

            await modelOtp.deleteOne({ email: decoded.email });
            res.clearCookie("tokenResetPassword");

            return res.status(200).json({ message: "Đặt lại mật khẩu thành công" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }
}

export default new UsersController();
