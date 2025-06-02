import express from "express";
import cors from "cors"
const app = express();
// middleware
app.use(cors());
app.use(express.json());
// routes declaration
import userRouter from "./routers/user.routes.js"
import cashInRouter from "./routers/cashIn.routes.js"
import transactionHistory from "./routers/transactionHistory.routes.js"
//
app.use("/users", userRouter)
app.use("/cashIn", cashInRouter)
app.use("/transaction-history", transactionHistory)
export { app }