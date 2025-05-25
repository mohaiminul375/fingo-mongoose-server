import mongoose from "mongoose";

const transactionModel = new mongoose.Schema(
    {
        TrxID: {
            type: String,
            required: true,
        },
        method: {
            type: String,
            required: true,
        },
        sender_name: {
            type: String,
            required: true,
        },
        sender_phone_number: {
            type: String,
            required: true,
        },
        receiver_name: {
            type: String,
            required: true,
        },
        receiver_phone_number: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        }
    }, {
    timestamps: true
}
)
export const UserTransaction = mongoose.model("userTransaction", transactionModel)