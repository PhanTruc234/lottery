import mongoose from "mongoose"

const { Schema } = mongoose;

const usersSchema = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true, unique: true },
        password: { type: String, require: true }
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('users', usersSchema);
