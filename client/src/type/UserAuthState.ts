export interface UserAuthState {
    accessToken: string | null;
    user: any | null;
    loading: boolean;

    setAccessToken: (token: string) => void;
    clearState: () => void;

    signUp: (fullName: string, email: string, password: string, captchaToken: string) => Promise<any>;
    login: (email: string, password: string, captchaToken: string) => Promise<any>;
    logout: () => Promise<void>;
    forgotPassword: (email: string, captchaToken: string) => Promise<any>
    resetPassword: (otp: string, newPassword: string, captchaToken: string) => Promise<any>
}
