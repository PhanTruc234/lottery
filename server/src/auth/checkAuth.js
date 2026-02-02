import { verifyToken } from "../services/tokenServices.js";

const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Missing Authorization header" });
        }
        const accessToken = authHeader.split(" ")[1];
        if (!accessToken) {
            return res.status(401).json({ message: "Invalid token format" });
        }
        // console.log(">>> accessToken", accessToken)
        const decode = await verifyToken(accessToken);
        // console.log(">>> decode", decode)
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorize" });
    }
};
export default authUser;