import axios from "axios";

export const verifyCaptcha = async (token) => {
    const res = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
            params: {
                secret: process.env.SECRET_KEY,
                response: token,
            },
        }
    );
    return res.data.success;
};
