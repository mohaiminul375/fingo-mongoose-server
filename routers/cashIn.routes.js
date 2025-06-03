import { Router } from "express";
import { User } from "../models/user.model.js";
import bcrypt from 'bcrypt'
const router = Router();
import { v4 as uuidv4 } from 'uuid';
import { UserTransaction } from "../models/transaction.model.js";
import { MasterTransaction } from "../models/MasterTransaction.js";
import mongoose from "mongoose";

router.post('/verify-cashIn', async (req, res) => {
    try {
        const {
            PIN,
            sender_name,
            sender_phone_number,
            method,
            receiver_phone_number,
            trx_amount
        } = req.body;
        console.log(req.body)
        // Ensure the method is cashIn
        if (method !== 'cashIn') {
            return res.status(400).json({ message: 'Invalid method' });
        }
        const verifyAgent = await User.findOne({ phone_number: sender_phone_number });
        if (!verifyAgent) {
            return res.status(404).json({ message: 'Agent not found' });
        }
        //verify pin
        const isMatch = await bcrypt.compare(PIN, verifyAgent.PIN);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Verify receiver's phone number
        const verifyReceiver = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyReceiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        if (verifyReceiver.accountType !== 'User') {
            return res.status(404).json({ message: 'Receiver must a customer' });
        }
        let receiver_name = verifyReceiver.name;
        const verifiedTransaction = {
            method,
            sender_name,
            sender_phone_number,
            receiver_name,
            receiver_phone_number,
            amount: trx_amount
        };
        res.status(200).json({ verifiedTransaction })
    } catch (error) {
        console.error('Error in verify-cashIn:', error);
        return res.status(500).json({ message: 'An error occurred while processing the transaction' });
    }
})
router.post('/complete-cashIn', async (req, res) => {
    const session = await mongoose.startSession(); // start session
    session.startTransaction();
    console.log(req.body)
    try {
        const { sender_name, sender_phone_number, receiver_name, receiver_phone_number, amount } = req.body;
        // Get Agent
        const verifyAgent = await User.findOne({ phone_number: sender_phone_number });
        if (!verifyAgent) {
            return res.status(404).json({ message: 'Agent not found' });
        }
        // Check if Agent has enough balance
        const parsedAmount = parseFloat(amount);
        if (verifyAgent.current_balance < parsedAmount) {
            return res.status(400).json({ message: 'Insufficient balance for agent' });
        }
        // Get Receiver
        const verifyReceiver = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyReceiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        // console.log(verifyReceiver, verifyAgent)
        // Calculate balances
        const agentBalanceCalculation = verifyAgent.current_balance - parsedAmount;
        const agentIncomeCalculation = verifyAgent.total_income + parsedAmount * 0.01;
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
                method: "Agent_cashIn",
                sender_name,
                sender_phone_number,
                receiver_name,
                receiver_phone_number,
                amount: parsedAmount,
                charge: 0,
                agent_income: parsedAmount * 0.01,
                linked_Trx_ref: trxObjectId2,
                masterTrx_ref: masterTrxObjectId,
            },
            {
                _id: trxObjectId2,
                TrxID: trx_id_2,
                method: "User_cashIn",
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
            method: "CashIn",
            sender_name,
            sender_phone_number,
            receiver_name,
            receiver_phone_number,
            amount: parsedAmount,
            agent_income: agentIncomeCalculation,
            admin_income: parsedAmount * 0.01,
            agent_charge: 0,
            user_charge: 0,
            linked_Trx_ref_1: trxObjectId1,
            linked_Trx_ref_2: trxObjectId2,
        })

        // Save transaction

        await UserTransaction.insertMany(newTrx, { session })
        await masterTrx.save({ session });
        // Update Balance
        await User.updateOne(
            { phone_number: sender_phone_number },
            {
                $set: {
                    current_balance: agentBalanceCalculation,
                    total_income: agentIncomeCalculation,
                }
            }, { session }
        );
        await User.updateOne(
            { phone_number: receiver_phone_number },
            {
                $inc: {
                    current_balance: parsedAmount,
                }
            }, { session }
        );

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'cashIn successfully' });
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession();
        return res.status(500).json({ message: 'An error occurred while processing cashIn' });
    }


})
export default router;