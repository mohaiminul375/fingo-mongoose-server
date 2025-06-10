import mongoose from "mongoose";

const incomeWithdrawModel = new mongoose.Schema({
    agent_name: {
        type: String,
        required: true,
    },
    agent_phone_number: {
        type: String,
        required: true,
    },
    request_amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        require: true,
        default: 'Pending'
    }
}, {
    timestamps: true
})
export const IncomeWithdraw = mongoose.model('income-withdraw', incomeWithdrawModel)