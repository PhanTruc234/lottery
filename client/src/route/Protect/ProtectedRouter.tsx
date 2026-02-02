import { Navigate, Outlet } from "react-router-dom";
import { UserAuthStore } from "../../store/userAuthStore";

export const ProtectedRouter = () => {
    const token =
        UserAuthStore((s) => s.accessToken) ||
        localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
