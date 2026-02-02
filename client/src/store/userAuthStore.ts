
import { create } from "zustand";
import { userService } from "../service/user/userService";
import type { UserAuthState } from "../type/UserAuthState";

export const UserAuthStore = create<UserAuthState>((set, get) => ({
    accessToken: null,
    user: (() => {
        const userStr = localStorage.getItem("userLottery")
        return userStr ? JSON.parse(userStr) : null;
    }),
    loading: false,
    setAccessToken: (accessToken: string) => {
        set({ accessToken });
    },
    clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        localStorage.removeItem("user");
        window.location.href = "/login";
    },
    signUp: async (fullName: string, email: string, password: string, captchaToken: string) => {
        try {
            set({ loading: true });
            const res = await userService.signUp(fullName, email, password, captchaToken)
            return res;
        } catch (error) {
            console.log(error);
        } finally {
            set({ loading: false })
        }
    },
    login: async (email: string, password: string, captchaToken: string) => {
        try {
            set({ loading: true });
            const res = await userService.login(email, password, captchaToken)
            if (res?.status === 200) {
                const { token, user } = res.data;
                console.log(token, user, "mdvkmkmfkbmf")
                console.log(res, "kkykokjukjuo")
                set({ accessToken: token });
                localStorage.setItem("token", token);
                localStorage.setItem("userLottery", JSON.stringify(user));
            }
            console.log(res, "resresresres")
            return res;
        } finally {
            set({ loading: false });
        }
    },
    logout: async () => {
        try {
            await userService.logout();
            get().clearState()
        } catch (error) {
            console.log(error)
        }
    },
    forgotPassword: async (email: string, captchaToken: string) => {
        try {
            set({ loading: true });
            return await userService.forgotPassword(email, captchaToken);
        } finally {
            set({ loading: false });
        }
    },
    resetPassword: async (otp: string, newPassword: string, captchaToken: string) => {
        try {
            set({ loading: true });
            return await userService.resetPassword(otp, newPassword, captchaToken);
        } finally {
            set({ loading: false });
        }
    },
}))