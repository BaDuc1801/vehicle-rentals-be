import paymentController from "../controller/paymentController.js";
import express from "express";

const paymentRouter = express.Router();

paymentRouter.get('/', paymentController.getAllPayments);
paymentRouter.get('/:id', paymentController.getPaymentById);
paymentRouter.post('/add-payment', paymentController.addPayment);
paymentRouter.put('/update-payment/:id', paymentController.updatePayment);
paymentRouter.delete('/delete-payment/:id', paymentController.deletePayment);

export default paymentRouter;