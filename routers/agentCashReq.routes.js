import { Router } from "express";
import { User } from "../models/user.model.js";
import { CashReq } from "../models/agentCashReq.model.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { MasterTransaction } from "../models/MasterTransaction.js";
import { UserTransaction } from "../models/transaction.model.js";
const router = Router();
router.get('/all-request', async (req, res) => {
    const result = await CashReq.find({ status: "Pending" });
    res.status(200).send(result)
})

router.post('/request', async (req, res) => {
    try {
        const { agent_name, agent_phone_number } = req.body;
        if (!agent_name || !agent_phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Agent name and phone number are required.'
            });
        }
        const verifyAgent = await User.findOne({ phone_number: agent_phone_number })
        if (verifyAgent.accountType !== 'Agent') {
            return res.status(500).json({
                success: false,
                message: 'Failed to verify Agent. Please try again.'
            })
        }
        const newCashRequest = new CashReq(req.body)
        await newCashRequest.save();
        res.status(200).json({ success: true, message: 'request was sent' });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'An error occurred while processing cashIn' });
    }
})
router.post('/approve-request', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log(req.body)
        const { _id, agent_name, agent_phone_number, request_amount } = req.body;
        // Validate required fields
        if (!_id || !agent_name || !agent_phone_number || !request_amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const amount = parseFloat(request_amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid request amount" });
        }
        // Verify if the agent exists
        const verifyAgent = await User.findOne({ phone_number: agent_phone_number });
        if (!verifyAgent) {
            return res.status(404).json({ message: "Agent not found" });
        }

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
                method: 'Cash_Request_Admin',
                sender_name: 'Fingo-admin',
                sender_phone_number: 'Fingo-mfs@admin',
                receiver_name: agent_name,
                receiver_phone_number: agent_phone_number,
                amount: amount,
                linked_Trx_ref: trxObjectId2,
                masterTrx_ref: masterTrxObjectId,
                admin_income: 0,
                charge: 0,
            },
            {
                _id: trxObjectId2,
                TrxID: trx_id_2,
                method: 'Cash_Request_Agent',
                sender_name: 'Fingo-admin',
                sender_phone_number: 'Fingo-mfs@admin',
                receiver_name: agent_name,
                receiver_phone_number: agent_phone_number,
                amount: amount,
                agent_income: 0,
                charge: 0,
                linked_Trx_ref: trxObjectId1,
                masterTrx_ref: masterTrxObjectId,
            }
        ];
        const newMasterTrx = new MasterTransaction({
            _id: masterTrxObjectId,
            Master_TrxID: master_trx_id,
            method: 'Cash_Request',
            sender_name: 'Fingo-mfs',
            sender_phone_number: 'Fingo-mfs@support',
            receiver_name: agent_name,
            receiver_phone_number: agent_phone_number,
            amount: amount,
            linked_Trx_ref_1: trxObjectId1,
            linked_Trx_ref_2: trxObjectId2,
            admin_income: 0,
            agent_charge: 0,
            user_charge: 0,
            agent_income: 0,
        });

        await UserTransaction.insertMany(newTrx, { session })
        await newMasterTrx.save({ session });
        await User.updateOne({ _id: _id }, {
            $inc: {
                current_balance: amount
            }
        }, { session })
        await CashReq.updateOne({ agent_phone_number }, {
            $set: {
                status: 'Approved',
            }
        }, { session })
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ success: true, message: 'Cash Request approved' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: 'An error occurred while processing cash Request' })
    }
})
export default router;