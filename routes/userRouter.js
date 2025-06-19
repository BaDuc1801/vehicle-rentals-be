import express from "express"
import userController from "../controller/userController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import multer from "multer";

const userRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
})

userRouter.get('/', userController.getUsers);
userRouter.get('/get-infor', userMiddleware.verifyToken, userController.getUserInfor);
userRouter.get('/get-user-by-id/:id', userController.getUserById);
userRouter.post('/register', userMiddleware.checkValidUser, userController.register);
userRouter.post('/login', userController.login);
userRouter.post('/logout', userController.logout);
userRouter.post('/forgot-password', userController.sendEmail);
userRouter.post('/refresh-token', userController.refreshAccessToken);
userRouter.put('/user/:id', userMiddleware.verifyToken, userController.updateUserByAdmin);
userRouter.put('/update-infor', userMiddleware.verifyToken, userController.updateUser);
userRouter.put('/up-avatar', userMiddleware.verifyToken, upload.single('avatar'), userController.uploadAvatar);
userRouter.put('/up-avatar-by-admin/:id',upload.single('avatar'), userController.uploadAvatarByAdmin);
userRouter.put('/change-password', userMiddleware.verifyToken, userController.changePassword);
userRouter.delete('/delete-user/:id', userController.deleteUser);

export default userRouter