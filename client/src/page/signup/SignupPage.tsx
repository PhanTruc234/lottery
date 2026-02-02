import { useState, useRef } from "react";
import { UserAuthStore } from "../../store/userAuthStore";
import { Link, useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

export default function SignupPage() {
    const navigate = useNavigate();
    const captchaRef = useRef<ReCAPTCHA>(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [disable, setDisable] = useState(false)
    const { signUp } = UserAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const captchaToken = captchaRef.current?.getValue();
        if (!captchaToken) {
            alert("Vui lòng xác minh reCAPTCHA");
            return;
        }
        try {
            const res = await signUp(fullName, email, password, captchaToken);
            if (res?.status === 200) {
                navigate("/login");
            }
        } catch (err: any) {
            toast.error(err.message || "Đăng kí thất bại");
            if (err.status === 429) {
                setDisable(true);
                setTimeout(() => {
                    setDisable(false)
                }, 60 * 1000)
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
                    Tạo tài khoản
                </h1>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Họ và tên
                    </label>
                    <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-black"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-black"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Mật khẩu
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-black"
                        required
                    />
                </div>

                {/* CAPTCHA */}
                <div className="flex justify-center">
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey="6LepGlwsAAAAAJIZGQblxynauG40Qz0EY5Q264AG"
                    />
                </div>

                <button
                    type="submit"
                    disabled={disable}
                    className={`w-full rounded-lg py-2.5 font-semibold text-white transition
    ${disable
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {disable ? "Vui lòng chờ..." : "Đăng kí"}
                </button>

                <div className="text-sm text-center">
                    <span className="text-gray-600">Đã có tài khoản? </span>
                    <Link
                        to="/login"
                        className="text-blue-500 font-medium hover:underline"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </form>
        </div>
    );
}
