import express from "express"
import multer from "multer";
import vehicleController from "../controller/vehicleController.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
})

const vehicleRouter = express.Router();

vehicleRouter.get('/', vehicleController.getAllVehicles);
vehicleRouter.post('/add-vehicle', vehicleController.addvehicle);
vehicleRouter.put('/update-vehicle/:id', vehicleController.updatevehicle);
vehicleRouter.put('/add-img/:id', upload.single('img'), vehicleController.uploadAvatar);
vehicleRouter.delete('/del-vehicle/:id', vehicleController.deletevehicle);

export default vehicleRouter;