import { useState, useRef } from "react";
import { UserAuthStore } from "../../store/userAuthStore";
import { Link, useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const captchaRef = useRef<ReCAPTCHA>(null);
    const [disable, setDisable] = useState(false)
    const { resetPassword, loading } = UserAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const captchaToken = captchaRef.current?.getValue();
        if (!captchaToken) {
            alert("Vui lòng xác minh reCAPTCHA");
            return;
        }
        try {
            const res = await resetPassword(otp, newPassword, captchaToken);
            if (res?.status === 200) {
                navigate("/login");
            }
        } catch (err: any) {
            toast.error(err.message || "Đăng nhập thất bại");
            if (err.status === 429) {
                setDisable(true);
                setTimeout(() => {
                    setDisable(false)
                }, 10 * 60 * 1000)
            }
            captchaRef.current?.reset();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-6"
            >
                <h1 className="text-3xl font-bold text-center text-blue-600">
                    Đặt lại mật khẩu
                </h1>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Mã OTP
                    </label>
                    <input
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-center tracking-widest text-black"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Mật khẩu mới
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-black"
                        required
                    />
                </div>

                <div className="flex justify-center">
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey="6LepGlwsAAAAAJIZGQblxynauG40Qz0EY5Q264AG"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || disable}
                    className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white
             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Đang xử lý..." : "Xác nhận"}
                </button>

                <div className="text-center text-sm">
                    <Link to="/login" className="text-gray-600 hover:text-blue-500">
                        ← Quay lại đăng nhập
                    </Link>
                </div>
            </form>
        </div>
    );
}
