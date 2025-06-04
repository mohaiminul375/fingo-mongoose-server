import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from 'uuid';
import { UserTransaction } from "../models/transaction.model.js";
import { MasterTransaction } from "../models/MasterTransaction.js";
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
        //calculate trx charge --if more than 5 % 5 taka will charge
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
            charge: trx_charge
        };
        res.status(200).json({ verifiedTransaction })
    } catch (error) {
        console.error('Error in verify-sendMoney:', error);
        return res.status(500).json({ message: 'An error occurred while processing the transaction' });
    }
})
router.post('/complete-sendMoney', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { sender_name, sender_phone_number, receiver_name, receiver_phone_number, amount, charge } = req.body;
        // Get Agent
        const verifySender = await User.findOne({ phone_number: sender_phone_number });
        if (!verifySender) {
            return res.status(404).json({ message: 'Sender not found' });
        }
        // Get Receiver
        const verifyReceiver = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyReceiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        // Calculate sender balance
        const parsedAmount = parseFloat(amount);
        const parsedCharge = parseFloat(charge)
        const senderBalanceCalculation = verifySender.current_balance - parsedAmount - parsedCharge;
        // Calculate Receiver balance add amount to balance
        const receiverBalanceCalculation = verifyReceiver.current_balance + parsedAmount;
        // insert data to DB
        const trx_id_1 = uuidv4().slice(0, 10);
        const trx_id_2 = uuidv4().slice(0, 10);
        const master_trx_id = uuidv4().slice(0, 10);
        const trxObjectId1 = new mongoose.Types.ObjectId();
        const trxObjectId2 = new mongoose.Types.ObjectId();
        const masterTrxObjectId = new mongoose.Types.ObjectId();

        const newTrx = [
            {
                _id: trxObjectId1,
                TrxID: trx_id_1,
                method: "sendMoney",
                sender_name,
                sender_phone_number,
                receiver_name,
                receiver_phone_number,
                amount: parsedAmount,
                charge: parsedCharge,
                linked_Trx_ref: trxObjectId2,
                masterTrx_ref: masterTrxObjectId,
            },
            {
                _id: trxObjectId2,
                TrxID: trx_id_2,
                method: "receivedMoney",
                sender_name,
                sender_phone_number,
                receiver_name,
                receiver_phone_number,
                amount: parsedAmount,
                charge: 0,
                linked_Trx_ref: trxObjectId1,
                masterTrx_ref: masterTrxObjectId,
            }
        ];

        const masterTrx = new MasterTransaction({
            _id: masterTrxObjectId,
            Master_TrxID: master_trx_id,
            method: "sendMoney",
            sender_name,
            sender_phone_number,
            receiver_name,
            receiver_phone_number,
            amount: parsedAmount,
            admin_income: 5,
            sender_charge: parsedCharge,
            receiver_charge: 0,
            linked_Trx_ref_1: trxObjectId1,
            linked_Trx_ref_2: trxObjectId2,
        })
        console.log(1)
        // Save transaction
        await UserTransaction.insertMany(newTrx, { session })
        console.log(2)
        await masterTrx.save({ session });
        console.log(3)
        await User.updateOne(
            { phone_number: sender_phone_number },
            {
                $set: {
                    current_balance: senderBalanceCalculation,
                }
            }, { session }
        );
        console.log(4)
        await User.updateOne(
            { phone_number: receiver_phone_number },
            {
                $set: {
                    current_balance: receiverBalanceCalculation,
                }
            }, { session }
        );
        await User.updateOne(
            { accountType: "Admin" },
            { $inc: { total_income: 5 } }, { session }
        );

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ success: true, message: 'Transaction completed successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: 'An error occurred while processing cashIn' });
    }
})
export default router;
