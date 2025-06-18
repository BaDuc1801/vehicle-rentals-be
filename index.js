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
    origin: ['https://vehicle-rentals-fe.vercel.app', 'http://localhost:5173'],  
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    credentials: true, 
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

