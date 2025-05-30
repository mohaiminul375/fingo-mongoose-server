import mongoose from "mongoose";

const transactionModel = new mongoose.Schema({

    Master_TrxID: {
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
    admin_income: {
        type: Number,
    },
    agent_income: {
        type: Number,
    },
    amount: {
        type: Number,
        required: true,
    },
    linked_Trx_ref_1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTransaction'
    },
    linked_Trx_ref_2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTransaction'
    }
},

    {
        timestamps: true
    }
)
export const MasterTransaction = mongoose.model('MasterTransaction', transactionModel)