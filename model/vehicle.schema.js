import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    img: String,
    name: String,
    price: Number,
    vehicleType: {
        type: String,
        enum: ["car", "motorbike"]
    },
    fuel: {
        type: String,
        enum: ["Xăng", "Điện"]
    },
    fuelEfficiency: Number,
    location: String,
    district: String,
    year: Number,
    transmission: String,
    seats: Number,
    brand: String
}, { timestamps: true })

const vehicleModel = mongoose.model('vehicles', vehicleSchema);

export default vehicleModel;