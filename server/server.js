import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import connectDB from "../server/src/config/connectDB.js";
import userRoute from "../server/src/routes/users.routes.js";
import usersController from "./src/controller/users.controller.js";
import authUser from "./src/auth/checkAuth.js";
import { globalLimiter } from "./src/middlewares/rateLimit.js";

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
app.use(globalLimiter);
app.use("/api", userRoute);
app.post("/logout", authUser, usersController.logout);

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
