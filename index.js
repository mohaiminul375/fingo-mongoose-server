import connectDB from "./db/index.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();



connectDB();