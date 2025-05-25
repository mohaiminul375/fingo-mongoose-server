import mongoose from "mongoose";

const userModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
        index: true, //optimize for search
    },
    email: {
        type: String,
        unique: true,
        required: true,
        index: true, //optimize for search
    },
    PIN: {
        type: String,
        required: true,
    },
    NID: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true,
    },
}, { timestamps: true })

export const User = mongoose.model("User", userModel)