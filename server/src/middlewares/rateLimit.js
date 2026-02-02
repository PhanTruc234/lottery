import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 300, // 300 lần
    standardHeaders: true,
    legacyHeaders: false,
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // 5 lần
    message: {
        message: "Đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const forgotPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 3, // 3 lần
    message: {
        message: "Bạn yêu cầu OTP quá nhiều lần, vui lòng đợi",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const resetPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 5,                  // 5 lần nhập OTP
    message: {
        message: "Bạn nhập OTP sai quá nhiều lần, vui lòng thử lại sau",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const refreshTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // 5 lần
    message: {
        message: "Refresh token bị giới hạn, vui lòng đăng nhập lại",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
