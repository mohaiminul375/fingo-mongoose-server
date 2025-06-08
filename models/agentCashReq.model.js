import mongoose from "mongoose";

const cashReqModel = new mongoose.Schema({
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
        default: 100000,
    },
    status: {
        type: String,
        require: true,
        default: 'Pending'
    }
}, {
    timestamps: true
})
export const CashReq = mongoose.model('Agent-Cash-Request', cashReqModel)