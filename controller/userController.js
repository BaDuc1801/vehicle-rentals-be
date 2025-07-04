import userModel from "../model/user.schema.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from 'cloudinary'
import dotenv from "dotenv"
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import admin from "../firebaseAdmin.js"
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
dotenv.config()

const getCloudinaryConfig = JSON.parse(process.env.CLOUD_DINARY_CONFIG);
cloudinary.config(getCloudinaryConfig);

const sendEmailService = async (email) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let info = await transporter.sendMail({
        from: '<minhduc180104@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello!", // plain text body
        html: "<b>Mật khẩu mới: 123456@</b>", // html body
    });
    return info
}

const userController = {
    getUsers: async (req, res) => {
        const listUser = await userModel.find();
        res.status(200).send(listUser);
    },

    getUserById: async (req, res) => {
        try {
            const id = req.params.id;
            const user = await userModel.findById(id);
            if (!user) {
                return res.status(404).send({ message: "Không tìm thấy người dùng" });
            }
            res.status(200).send(user);
        } catch (error) {
            res.status(400).send(error.message);
        }
    },

    register: async (req, res) => {
        try {
            const { email, password, username } = req.body;
            const hashedPassword = bcrypt.hashSync(password, 10);
            const user = await userModel.create({
                username,
                email,
                password: hashedPassword
            })
            res.status(201).send(user);
        } catch (error) {
            res.status(400).send(error.message)
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await userModel.findOne({ email });
            const compare = bcrypt.compareSync(password, user.password);
            if (!compare) {
                throw new Error('Email hoặc password không đúng');
            }
            const accessToken = jwt.sign({
                userId: user._id,
                role: user.role,
            }, process.env.SECRETKEY, { expiresIn: "1h" });

            const refreshToken = jwt.sign({
                userId: user._id,
                role: user.role,
            }, process.env.SECRETKEY, { expiresIn: "24h" });

            res.cookie("access_token", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "None",
            });
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });

            res.status(200).send({
                message: "Đăng nhập thành công",
            })
        } catch (error) {
            res.status(400).send(error.message)
        }
    },

    loginGoogle: async (req, res) => {
        try {
            const { tokenGoogle } = req.body;

            if (!tokenGoogle) {
                return res.status(400).send({ message: 'Token Google không hợp lệ' });
            }
            const ticket = await client.verifyIdToken({
                idToken: tokenGoogle,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                return res.status(401).send({ message: 'Xác thực Google thất bại' });
            }

            let user = await userModel.findOne({ email: payload.email });

            let isNewUser = false;
            if (!user) {
                user = await userModel.create({
                    username: payload.name,
                    email: payload.email,
                    password: '',
                    avatar: payload.picture,
                });
                isNewUser = true;
            }

            const accessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.SECRETKEY,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.SECRETKEY,
                { expiresIn: '24h' }
            );

            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });

            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });
            res.status(200).send({
                message: isNewUser ? 'Đăng ký Google thành công' : 'Đăng nhập Google thành công',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                },
            });

        } catch (err) {
            console.error(err);
            res.status(500).send({ message: 'Đăng nhập Google thất bại', error: err.message });
        }
    },

    checkPhoneEmail: async (req, res) => {
        try {
            const { email, phoneNumber } = req.body;

            if (!email || !phoneNumber) {
                return res.status(400).send({ message: "Thiếu email hoặc số điện thoại" });
            }
            const user = await userModel.findOne({ email });

            if (!user) {
                return res.status(200).send({ message: "Email chưa tồn tại, cho phép tạo user mới" });
            }

            if (user.phoneNumber !== phoneNumber) {
                return res.status(400).send({ message: "Số điện thoại không khớp với email này" });
            }

            return res.status(200).send({ message: "Số điện thoại khớp với email" });

        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: "Lỗi server", error: error.message });
        }
    },

    loginGoogleFirebase: async (req, res) => {
        try {
            const { idToken, phoneNumber } = req.body;
            console.log("hi1")
            if (!idToken) {
                return res.status(400).send({ message: 'ID token không hợp lệ' });
            }
            let decodedToken;
            console.log("hi2")
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
                console.log("hi3")
            } catch (error) {
                return res.status(401).send({ message: 'ID token không hợp lệ', error: error.message });
            }

            const { name, email, picture } = decodedToken;

            let user = await userModel.findOne({ email });
            let isNewUser = false;
            if (!user) {
                user = await userModel.create({
                    phoneNumber: phoneNumber,
                    username: name,
                    email,
                    password: '',
                    avatar: picture,
                });
                isNewUser = true;
            }

            const accessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.SECRETKEY,
                { expiresIn: '1h' }
            );
            const refreshToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.SECRETKEY,
                { expiresIn: '24h' }
            );

            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });

            res.status(200).send({
                message: isNewUser
                    ? 'Đăng ký Firebase Google thành công'
                    : 'Đăng nhập Firebase Google thành công',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                },
            });

        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Lỗi server loginGoogleFirebase', error: error.message });
        }
    },

    refreshAccessToken: async (req, res) => {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(401).send({ message: 'Không tìm thấy refresh token' });
        }
        try {
            const decoded = jwt.verify(refreshToken, process.env.SECRETKEY);
            const user = await userModel.findById(decoded.userId);
            if (!user) {
                return res.status(403).send({ message: 'Không tìm thấy người dùng' });
            }

            const newAccessToken = jwt.sign({
                userId: user._id,
                role: user.role
            }, process.env.SECRETKEY, { expiresIn: "1h" });

            res.status(200).send({ accessToken: newAccessToken });
        } catch (error) {
            res.status(403).send({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
        }
    },

    logout: async (req, res) => {
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
        });
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
        });
        res.status(200).send({ message: "Đăng xuất thành công" })
    },

    getUserInfor: async (req, res) => {
        const user = await userModel.findById(req.user.userId).populate({
            path: 'paymentId',
            populate: {
                path: 'vehicleId'
            }
        });
        const currentDate = new Date();
        user.paymentId.forEach(async (payment) => {
            if (payment.endDate && new Date(payment.endDate) < currentDate) {
                payment.status = "completed";
                payment.paymentMethod = "bank";
                await payment.save();
            }
        });
        res.status(200).send(user)
    },

    updateUser: async (req, res) => {
        const update = req.body;
        const rs = await userModel.findByIdAndUpdate(req.user.userId, update, { new: true });
        console.log(rs)
        res.status(200).send(rs)
    },

    updateUserByAdmin: async (req, res) => {
        const user = await userModel.findById(req.user.userId);
        if (user.role !== 'Admin') {
            return res.status(403).send({ message: "Bạn không có quyền thực hiện hành động này" })
        }
        const userId = req.params.id;
        const update = req.body;
        const rs = await userModel.findByIdAndUpdate({ _id: userId }, update, { new: true });
        res.status(200).send(rs)
    },

    deleteUser: async (req, res) => {
        const userId = req.params.id;
        const rs = await userModel.findByIdAndDelete(userId);
        res.status(200).send(rs)
    },

    uploadAvatar: async (req, res) => {
        let avatar = req.file;
        let userId = req.user.userId;
        let user = await userModel.findById(userId);
        if (user) {
            if (avatar) {
                const dataUrl = `data:${avatar.mimetype};base64,${avatar.buffer.toString('base64')}`;
                await cloudinary.uploader.upload(dataUrl,
                    { resource_type: 'auto' },
                    async (err, result) => {
                        if (result && result.url) {
                            user.avatar = result.url;
                            await user.save()
                            return res.status(200).send({
                                message: 'Client information updated successfully',
                                user: result.url
                            });
                        } else {
                            return res.status(500).send({
                                message: 'Error when upload file: ' + err.message
                            });
                        }
                    }
                )
            } else {
                return res.status(404).send({
                    message: 'Image not found'
                });
            }
        } else {
            return res.status(404).send({
                message: 'Client not found'
            });
        }
    },

    uploadAvatarByAdmin: async (req, res) => {
        let avatar = req.file;
        let userId = req.params.id;
        let user = await userModel.findById(userId);
        if (user) {
            if (avatar) {
                const dataUrl = `data:${avatar.mimetype};base64,${avatar.buffer.toString('base64')}`;
                await cloudinary.uploader.upload(dataUrl,
                    { resource_type: 'auto' },
                    async (err, result) => {
                        if (result && result.url) {
                            user.avatar = result.url;
                            await user.save()
                            return res.status(200).send({
                                message: 'Client information updated successfully',
                                user: result.url
                            });
                        } else {
                            return res.status(500).send({
                                message: 'Error when upload file: ' + err.message
                            });
                        }
                    }
                )
            } else {
                return res.status(404).send({
                    message: 'Image not found'
                });
            }
        } else {
            return res.status(404).send({
                message: 'Client not found'
            });
        }
    },

    changePassword: async (req, res) => {
        const { password, newPassword } = req.body;
        const user = await userModel.findOne({ _id: req.user.userId });
        const compare = bcrypt.compareSync(password, user.password);
        if (!compare) {
            return res.status(400).send({ message: "Mật khẩu cũ không đúng" })
        }
        const hashNewPassword = bcrypt.hashSync(newPassword, 10);
        const rs = await userModel.findByIdAndUpdate(req.user.userId, { password: hashNewPassword }, { new: true });
        res.status(200).send(rs)
    },

    sendEmail: async (req, res) => {
        const { email } = req.body;
        const newPassword = "123456@";
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await userModel.updateOne({ email: email }, { password: hashedPassword });
        const rs = await sendEmailService(email);
        res.status(200).send(rs)
    }
}

export default userController