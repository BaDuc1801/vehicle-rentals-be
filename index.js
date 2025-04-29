import mongoose from "mongoose"
import cors from 'cors'
import express from "express"
import dotenv from "dotenv"
import userRouter from "./routes/userRouter.js"
import cookieParser from "cookie-parser"
import vehicleRouter from "./routes/vehicleRouter.js"
import paymentRouter from "./routes/paymentRouter.js"
dotenv.config()

await mongoose.connect(process.env.MONGOCONNECT)

const corsOptions = {
    origin: 'http://localhost:5173',  // Chỉ định frontend của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Các phương thức được phép
    credentials: true,  // Cho phép gửi cookies
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.use('/users', userRouter)
app.use('/vehicles', vehicleRouter)
app.use('/payments', paymentRouter)

app.get("/", (req, res) => {
    res.status(200).json({ message: "hello!" });
});

app.listen(8080, () => {
    console.log("Server is running")
})

