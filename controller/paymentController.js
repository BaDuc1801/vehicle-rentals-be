import paymentModel from "../model/payment.schema.js";
import moment from "dayjs";

const paymentController = {
    addPayment: async (req, res) => {
        const data = req.body;
        const deposit = data.totalPrice * 0.3;
        const rs = await paymentModel.create({ ...data, deposit });
        const user = await paymentModel.findById(rs._id).populate('userId');
        if (user && user.userId) {
            user.userId.paymentId = user.userId.paymentId || [];
            user.userId.paymentId.push(rs._id);
            await user.userId.save();
        }
        res.status(200).send(rs);
    },

    getAllPayments: async (req, res) => {
        const { status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }
        const listPayment = await paymentModel.find(filter).populate('userId').populate('vehicleId').sort({ createdAt: -1 });
        const currentDate = new Date();
        listPayment.forEach(async (payment) => {
            if (payment.endDate && new Date(payment.endDate) < currentDate) {
                payment.status = "completed";
                payment.paymentMethod = "bank";
                await payment.save();
            }
        });
        res.status(200).send(listPayment);
    },

    getPaymentById: async (req, res) => {
        const paymentId = req.params.id;
        const rs = await paymentModel.findById(paymentId).populate('userId').populate('vehicleId');
        if (!rs) {
            return res.status(404).send({ message: "Payment not found" });
        }
        res.status(200).send(rs);
    },

    updatePayment: async (req, res) => {
        const paymentId = req.params.id;
        const data = req.body;
        const rs = await paymentModel.findByIdAndUpdate(paymentId, data, { new: true }).populate('userId').populate('vehicleId');
        if (!rs) {
            return res.status(404).send({ message: "Payment not found" });
        }
        const payment = await paymentModel.findById(paymentId).populate('userId').populate('vehicleId');
        if (payment.paymentMethod === "bank") {
            payment.paymentMethod = "cash";
            payment.deposit = payment.totalPrice;
        }
        const rentalDays = moment(payment?.endDate).diff(moment(payment?.startDate), 'days');
        const finalRentalDays = rentalDays < 1 ? 1 : rentalDays;
        payment.totalPrice = finalRentalDays * payment?.vehicleId?.price;
        await payment.save();
        res.status(200).send(payment);
    },

    deletePayment: async (req, res) => {
        const paymentId = req.params.id;
        const rs = await paymentModel.findByIdAndDelete(paymentId);
        if (!rs) {
            return res.status(404).send({ message: "Payment not found" });
        }
        res.status(200).send({ message: "Xóa thành công" });
    },
}

export default paymentController;