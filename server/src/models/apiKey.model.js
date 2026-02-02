import mongoose from "mongoose";

const Schema = mongoose.Schema;

const modelApiKey = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        publicKey: { type: String, require: true },
        privateKey: { type: String, require: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('apikey', modelApiKey);
