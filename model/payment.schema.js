import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    address: String,
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vehicles',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    deposit: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'canceled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['bank', 'cash'],
        required: true
    },
    note: {
        type: String,
        default: ''
    },
}, {timestamps: true});

const paymentModel = mongoose.model('payments', paymentSchema);
export default paymentModel;