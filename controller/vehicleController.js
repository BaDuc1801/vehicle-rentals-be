import vehicleModel from "../model/vehicle.schema.js"
import { v2 as cloudinary } from 'cloudinary'
import dotenv from "dotenv"
dotenv.config()

const getCloudinaryConfig = JSON.parse(process.env.CLOUD_DINARY_CONFIG);
cloudinary.config(getCloudinaryConfig);

const vehicleController = {
    getAllVehicles: async (req, res) => {
        try {
            const { transmission, seats, brand, district, location, sortBy, endDate, startDate, vehicleType } = req.query;
            let filter = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() + 1);
                filter._id = {
                    $nin: (await vehicleModel.aggregate([
                        {
                            $lookup: {
                                from: "payments",
                                localField: "_id",
                                foreignField: "vehicleId",
                                as: "payments"
                            }
                        },
                        {
                            $match: {
                                payments: {
                                    $elemMatch: {
                                        // status: "completed",
                                        $or: [
                                            {
                                                startDate: { $lte: end },
                                                endDate: { $gte: start }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: { _id: 1 }
                        }
                    ])).map(v => v._id)
                };
            }
            if (transmission) {
                filter.transmission = transmission;
            }
            if (vehicleType) {
                filter.vehicleType = vehicleType;
            }
            if (seats) {
                filter.seats = seats;
            }
            if (brand) {
                filter.brand = brand;
            }
            if (district) {
                filter.district = district;
            }
            if (location) {
                filter.location = location;
            }

            let sort = {};
            if (sortBy === "-1") {
                sort.price = -1;
            } else if (sortBy === "1") {
                sort.price = 1;
            } else {
                sort.price = 1;
            }

            const vehicles = await vehicleModel.find(filter).sort(sort);
            res.status(200).json(vehicles);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vehicles: " + error.message });
        }
    },

    addvehicle: async (req, res) => {
        const vehicle = req.body;
        const rs = await vehicleModel.create(vehicle);
        res.status(200).send(rs);
    },

    updatevehicle: async (req, res) => {
        const vehicleId = req.params.id;
        const data = req.body;
        const rs = await vehicleModel.findByIdAndUpdate({ _id: vehicleId }, data, { new: true })
        res.status(200).send(rs);
    },

    deletevehicle: async (req, res) => {
        const vehicleId = req.params.id;
        const rs = await vehicleModel.findByIdAndDelete(vehicleId, { new: true })
        res.status(200).send(rs);
    },

    uploadAvatar: async (req, res) => {
        let img = req.file;
        let vehicleId = req.params.id;
        let vehicle = await vehicleModel.findById(vehicleId);
        if (vehicle) {
            if (img) {
                const dataUrl = `data:${img.mimetype};base64,${img.buffer.toString('base64')}`;
                await cloudinary.uploader.upload(dataUrl,
                    { resource_type: 'auto' },
                    async (err, result) => {
                        if (result && result.url) {
                            vehicle.img = result.url;
                            await vehicle.save()
                            return res.status(200).json({
                                message: 'vehicle information updated successfully',
                                vehicle: result.url
                            });
                        } else {
                            return res.status(500).json({
                                message: 'Error when upload file: ' + err.message
                            });
                        }
                    }
                )
            } else {
                return res.status(404).json({
                    message: 'Image not found'
                });
            }
        } else {
            return res.status(404).json({
                message: 'vehicle not found'
            });
        }
    },
}

export default vehicleController;