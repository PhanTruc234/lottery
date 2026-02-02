import { Routes, Route } from "react-router-dom";
import { LayoutAccount } from "../../layout/LayoutAccount/LayoutAccount";
import LoginPage from "../../page/login/LoginPage";
import SignupPage from "../../page/signup/SignupPage";
import Home from "../../app/page";
import { ProtectedRouter } from "../Protect/ProtectedRouter";
import ResetPasswordPage from "../../page/Reset/ResetPasswordPage";
import ForgotPasswordPage from "../../page/ForgotPass/ForgotPasswordPage";

export const RouterAccount = () => {
    return (
        <Routes>
            <Route element={<LayoutAccount />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/sign-up" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRouter />}>
                <Route path="/home" element={<Home />} />
            </Route>
        </Routes>
    );
};
