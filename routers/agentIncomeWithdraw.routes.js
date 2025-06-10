import { Router } from "express";
import { IncomeWithdraw } from "../models/agentIncomeWithdraw.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { MasterTransaction } from "../models/MasterTransaction.js";
import { UserTransaction } from "../models/transaction.model.js";
const router = Router();
router.get('/all-request', async (req, res) => {
    const result = await IncomeWithdraw.find();
    res.send(result)
})

router.post('/request', async (req, res) => {
    try {
        const { agent_name, agent_number, withdrawAmount } = req.body;
        if (!agent_name || !agent_number) {
            return res.status(400).json({
                success: false,
                message: 'Agent name and phone number are required.'
            });
        }
        // Verify Agent
        const verifyAgent = await User.findOne({ phone_number: agent_number })
        if (verifyAgent.accountType !== 'Agent') {
            return res.status(500).json({
                success: false,
                message: 'Failed to verify Agent. Please try again.'
            });
        }
        const newReq = new IncomeWithdraw({
            agent_name,
            agent_phone_number: agent_number,
            request_amount: withdrawAmount,
        })
        await newReq.save();
        res.status(200).json({ success: true, message: 'request was sent' });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'An error occurred while processing withdraw request' });
    }
})
router.post('/approve-request', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { _id, agent_name, agent_phone_number, request_amount } = req.body;
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
                method: 'Withdraw_Income_Admin',
                sender_name: 'Fingo-admin',
                sender_phone_number: 'Fingo-mfs@admin',
                receiver_name: agent_name,
                receiver_phone_number: agent_phone_number,
                amount: request_amount,
                linked_Trx_ref: trxObjectId2,
                masterTrx_ref: masterTrxObjectId,
                admin_income: 0,
                charge: 0,
            },
            {
                _id: trxObjectId2,
                TrxID: trx_id_2,
                method: 'Withdraw_Income_Agent',
                sender_name: 'Fingo-admin',
                sender_phone_number: 'Fingo-mfs@admin',
                receiver_name: agent_name,
                receiver_phone_number: agent_phone_number,
                amount: request_amount,
                agent_income: 0,
                charge: 0,
                linked_Trx_ref: trxObjectId1,
                masterTrx_ref: masterTrxObjectId,
            }
        ];

        const newMasterTrx = new MasterTransaction({
            _id: masterTrxObjectId,
            Master_TrxID: master_trx_id,
            method: 'Withdraw_Request',
            sender_name: 'Fingo-mfs',
            sender_phone_number: 'Fingo-mfs@support',
            receiver_name: agent_name,
            receiver_phone_number: agent_phone_number,
            amount: request_amount,
            linked_Trx_ref_1: trxObjectId1,
            linked_Trx_ref_2: trxObjectId2,
            admin_income: 0,
            agent_income: 0,
            agent_charge: 0,
        });

        await IncomeWithdraw.updateOne({ _id }, {
            $set: {
                status: 'Approved',
            }
        }, { session })

        await UserTransaction.insertMany(newTrx, { session })
        await newMasterTrx.save({ session });
        await User.updateOne({ phone_number: agent_phone_number }, {
            $inc: {
                total_income: -request_amount
            }
        }, { session })
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ success: true, message: 'Cash Request approved' });
    } catch (error) {

    }
})


export default router;