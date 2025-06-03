import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
const router = Router();

router.post('/verify-sendMoney', async (req, res) => {
    try {
        const {
            PIN,
            sender_name,
            sender_phone_number,
            method,
            receiver_phone_number,
            trx_amount
        } = req.body;
        //check not send same number
        if (sender_phone_number === receiver_phone_number) {
            return res.status(400).json({ message: 'Invalid method' });
        }
        if (method !== 'sendMoney') {
            return res.status(400).json({ message: 'Invalid method' });
        }
        // verify sender
        const verifySender = await User.findOne({ phone_number: sender_phone_number });
        if (!verifySender) {
            return res.status(404).json({ message: 'Sender not found' });
        }
        //verify pin
        const isMatch = await bcrypt.compare(PIN, verifySender.PIN);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Verify receiver's phone number
        const verifyReceiver = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyReceiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        //calculate trx charge
        let trx_charge = 0;
        const parsedAmount = parseFloat(trx_amount);
        if (parsedAmount > 100) {
            trx_charge = 5
        }
        let receiver_name = verifyReceiver.name;
        const verifiedTransaction = {
            method,
            sender_name,
            sender_phone_number,
            receiver_name,
            receiver_phone_number,
            amount: trx_amount,
            trx_charge
        };
        res.status(200).json({ verifiedTransaction })
    } catch (error) {
        console.error('Error in verify-cashIn:', error);
        return res.status(500).json({ message: 'An error occurred while processing the transaction' });
    }
})
export default router;
