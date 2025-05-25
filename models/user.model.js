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
        enum: ['user', 'agent'],
        default: 'active'
    },
    current_balance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'active'
    },
}, { timestamps: true })
userModel.pre('save', function (next) {
    if (this.isNew) {
        if (this.accountType === 'agent') {
            this.status = 'pending';
            this.current_balance = 100000;
        } else if (this.accountType === 'user') {
            this.status = 'active';
            this.current_balance = 40;
        }
    }
    next();
});
export const User = mongoose.model("User", userModel)