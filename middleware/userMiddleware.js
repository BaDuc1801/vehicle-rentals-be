import userModel from "../model/user.schema.js";
import jwt from "jsonwebtoken"

const userMiddleware = {
    checkValidUser: async (req, res, next) => {
        const { email } = req.body;
        const existed = await userModel.findOne({ email })
        if (existed) {
            return res.status(400).send({ message: "Email đã tồn tại" })
        }
        else {
            next()
        }
    },
    verifyToken: async (req, res, next) => {
        try {
            const token = req.cookies.access_token;
            if (token) {
                jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
                    if (err) {
                        return res.status(401).json({ message: 'Access token is invalid' });
                    } else {
                        req.user = decoded;
                        next();
                    }
                });
            } else {
                res.status(401).json({ message: token });
            }
        } catch (error) {
            res.status(401).json({ message: 'Access token is missing' });
        }
    },
    checkRoleAdmin: (req, res, next) => {
        if (req.user && req.user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ message: 'Bạn không có quyền truy cập' });
        }
    }
}

export default userMiddleware