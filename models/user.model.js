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
        enum: ['User', 'Agent'],
    },
    current_balance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Pending'],
        default: 'Active'
    },
    total_income: {
        type: Number,
        required: function () {
            return this.accountType === 'Agent';
        }
    }
}, { timestamps: true })

// Explain
userModel.pre('validate', function (next) {
    if (this.isNew && this.accountType === 'Agent') {
        this.total_income = 0;
    }
    next();
});
userModel.pre('save', function (next) {
    if (this.isNew) {
        if (this.accountType === 'Agent') {
            this.status = 'Pending';
            this.current_balance = 100000;
        } else if (this.accountType === 'User') {
            this.status = 'Active';
            this.current_balance = 40;
        }
    }
    next();
});
export const User = mongoose.model("User", userModel)