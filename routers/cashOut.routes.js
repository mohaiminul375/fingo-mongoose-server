import { Router } from "express";
import { User } from "../models/user.model.js";
import bcrypt from 'bcrypt'
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { UserTransaction } from "../models/transaction.model.js";
import { MasterTransaction } from "../models/MasterTransaction.js";
const router = Router();

router.post('/verify-cashOut', async (req, res) => {
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
        if (sender_phone_number === receiver_phone_number) {
            return res.status(400).json({ message: 'Invalid method' });
        }
     
        if (method !== 'cashOut') {
            return res.status(400).json({ message: 'Invalid method' });
        }
  
        // Verify Sender's phone number and PIN
        const verifySender = await User.findOne({ phone_number: sender_phone_number });
        if (!verifySender) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        const isMatch = await bcrypt.compare(PIN, verifySender.PIN);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Verify receiver agent's phone number
        const verifyAgent = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyAgent) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        if (verifyAgent.accountType !== 'Agent') {
            return res.status(404).json({ message: 'Receiver is not valid' });
        }
        let receiver_name = verifyAgent.name;
        // Parse amount
        const parsedAmount = parseFloat(trx_amount);
        const calculateTrxAmount = parsedAmount * 0.015;
        // Verified info send to front-end
        const verifiedTransaction = {
            method,
            sender_name,
            sender_phone_number,
            receiver_name,
            receiver_phone_number,
            amount: trx_amount,
            charge: calculateTrxAmount,
        };

        // Send response with verified transaction details
        return res.status(200).json({ verifiedTransaction });
    } catch (error) {
        console.error('Error in verify-cashOut:', error);
        return res.status(500).json({ message: 'An error occurred while processing the transaction' });
    }
})
router.post('/complete-cashOut', async (req, res) => {
    const session = await mongoose.startSession(); // start session
    session.startTransaction();
    try {
        const { method, sender_name, sender_phone_number, receiver_name, receiver_phone_number, amount, charge } = req.body;
        // Get Agent
        const verifyUser = await User.findOne({ phone_number: sender_phone_number });
        if (!verifyUser) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Get Receiver
        const verifyAgent = await User.findOne({ phone_number: receiver_phone_number });
        if (!verifyAgent) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        const parsedAmount = parseFloat(amount);
        const parsedCharge = parseFloat(charge)
        const senderBalanceCalculation = verifyUser.current_balance - parsedAmount - parsedCharge;
        // Calculate Receiver balance add amount to balance
        const agentBalanceCalculation = verifyAgent.current_balance + parsedAmount;
        const agentIncomeCalculation = verifyAgent.total_income + parsedAmount * 0.01;
        const adminIncomeCalculation = parsedAmount * 0.005;
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
                method: "User_cashOut",
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
                method: "Agent_cashOut",
                sender_name,
                sender_phone_number,
                receiver_name,
                receiver_phone_number,
                amount: parsedAmount,
                charge: 0,
                agent_income: parsedAmount * 0.01,
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
            admin_income: parsedAmount * 0.005,
            agent_income: parsedAmount * 0.01,
            agent_charge: 0,
            user_charge: parsedCharge,
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
                    current_balance: senderBalanceCalculation,
                }
            }, { session }
        );
        await User.updateOne(
            { phone_number: receiver_phone_number },
            {
                $set: {
                    current_balance: agentBalanceCalculation,
                    total_income: agentIncomeCalculation,
                }
            }, { session }
        );
        await User.updateOne(
            { accountType: "Admin" },
            { $inc: { total_income: adminIncomeCalculation } }, { session }
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