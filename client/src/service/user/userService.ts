
import { API_FORGOT_PASSWORD, API_LOGOUT, API_RESET_PASSWORD, API_SIGN_IN, API_SIGN_UP } from "../../api/api";
import axiosClient from "../axiosClient";
export const userService = {
    signUp: async (
        fullName: string,
        email: string,
        password: string,
        captchaToken: string
    ) => {
        const res = await axiosClient.post(API_SIGN_UP, {
            fullName,
            email,
            password,
            captchaToken,
        });
        return res;
    },

    login: async (email: string, password: string, captchaToken: string) => {
        const res = await axiosClient.post(API_SIGN_IN, {
            email,
            password,
            captchaToken,
        });
        return res;
    },

    logout: async () => {
        const res = await axiosClient.get(API_LOGOUT);
        return res;
    },
    forgotPassword: async (email: string, captchaToken: string) => {
        const res = await axiosClient.post(API_FORGOT_PASSWORD, {
            email,
            captchaToken,
        });
        return res;
    },
    resetPassword: async (
        otp: string,
        newPassword: string,
        captchaToken: string
    ) => {
        const res = await axiosClient.post(
            API_RESET_PASSWORD,
            { otp, newPassword, captchaToken },
            { withCredentials: true }
        );
        return res;
    },
};
