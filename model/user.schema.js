import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: String,
    phoneNumber: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ['Customer', 'Admin', 'Operator'],
        default: 'Customer'
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/dzpw9bihb/image/upload/v1726676632/wgbdsrflw8b1vdalkqht.jpg"
    },
    paymentId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'payments',
        required: true
    }],
    createdAt: { type: Date, default: Date.now }
})

const userModel = mongoose.model('users', userSchema);

export default userModel