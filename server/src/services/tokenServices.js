import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config";
import { jwtDecode } from "jwt-decode";

import modelApiKey from "../models/apiKey.model.js";
const createApiKey = async (userId) => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
    });
    const privateKeyString = privateKey.export({
        type: "pkcs8",
        format: "pem",
    });

    const publicKeyString = publicKey.export({
        type: "spki",
        format: "pem",
    });

    const newApiKey = new modelApiKey({
        userId,
        publicKey: publicKeyString,
        privateKey: privateKeyString,
    });

    return await newApiKey.save();
};
const createToken = async (payload) => {
    const apiKey = await modelApiKey.findOne({
        userId: payload.id.toString(),
    });

    if (!apiKey?.privateKey) {
        const error = new Error("Private key not found");
        error.statusCode = 401;
        throw error;
    }

    return jwt.sign(payload, apiKey.privateKey, {
        algorithm: "RS256",
        expiresIn: "15m",
    });
};
const createRefreshToken = async (payload) => {
    const apiKey = await modelApiKey.findOne({
        userId: payload.id.toString(),
    });

    if (!apiKey?.privateKey) {
        const error = new Error("Private key not found");
        error.statusCode = 401;
        throw error;
    }

    return jwt.sign(payload, apiKey.privateKey, {
        algorithm: "RS256",
        expiresIn: "7d",
    });
};
const verifyToken = async (token) => {
    try {
        const { id } = jwtDecode(token);

        const apiKey = await modelApiKey.findOne({ userId: id });

        if (!apiKey) {
            const error = new Error("Unauthorized");
            error.statusCode = 401;
            throw error;
        }

        return jwt.verify(token, apiKey.publicKey, {
            algorithms: ["RS256"],
        });
    } catch (err) {
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    }
};

export {
    createApiKey,
    createToken,
    createRefreshToken,
    verifyToken,
};
