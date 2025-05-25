import express from "express";
import cors from "cors"
const app = express();
// middleware
app.use(cors());
app.use(express.json());
// routes declaration
import userRouter from "./routers/user.routes.js"
//
app.use("/users", userRouter)
export { app }