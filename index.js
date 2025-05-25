import connectDB from "./db/index.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = process.env.PORT || 5000 //review


connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running at port:${port}`);
        })
    })
    .catch((error) => console.error('MongoDB connection Failed!!', error))