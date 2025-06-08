import express from "express";
import cors from "cors"
const app = express();
// middleware
app.use(cors());
app.use(express.json());
// routes declaration
import userRouter from "./routers/user.routes.js"
import cashInRouter from "./routers/cashIn.routes.js"
import transactionHistoryRouter from "./routers/transactionHistory.routes.js"
import sendMoneyRouter from "./routers/sendMoney.routes.js"
import cashOutRouter from "./routers/cashOut.routes.js"
import agentRequestMoney from "./routers/agentCashReq.routes.js"
//routers
app.use("/users", userRouter)
app.use("/cashIn", cashInRouter)
app.use("/transaction-history", transactionHistoryRouter)
app.use("/send-money", sendMoneyRouter)
app.use("/cashOut", cashOutRouter)
app.use("/request-money-agent", agentRequestMoney)
export { app }