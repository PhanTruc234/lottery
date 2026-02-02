import { useState, useRef } from "react";
import { UserAuthStore } from "../../store/userAuthStore";
import { Link, useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const captchaRef = useRef<ReCAPTCHA>(null);
    const [disable, setDisable] = useState(false)
    const { login } = UserAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const captchaToken = captchaRef.current?.getValue();
        if (!captchaToken) {
            alert("Vui lòng xác minh reCAPTCHA");
            return;
        }
        try {
            await login(email, password, captchaToken);
            toast.success("Đăng nhập thành công");
            navigate("/home");
        } catch (err: any) {
            toast.error(err.message || "Đăng nhập thất bại");
            if (err.status === 429) {
                setDisable(true);
                setTimeout(() => {
                    setDisable(false)
                }, 15 * 60 * 1000)
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
                    Đăng nhập
                </h1>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Mật khẩu
                    </label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <Link to="/forgot-password" className="text-black hover:underline">
                        Quên mật khẩu?
                    </Link>
                    <Link to="/sign-up" className="text-black hover:text-blue-500">
                        Đăng ký
                    </Link>
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
                    {disable ? "Vui lòng chờ..." : "Đăng nhập"}
                </button>

                <div className="flex justify-center">
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey="6LepGlwsAAAAAJIZGQblxynauG40Qz0EY5Q264AG"
                    />
                </div>
            </form>
        </div>
    );
}
