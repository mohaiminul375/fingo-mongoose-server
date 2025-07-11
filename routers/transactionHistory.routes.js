import { Router } from "express";
import { UserTransaction } from "../models/transaction.model.js";
import { MasterTransaction } from "../models/MasterTransaction.js";

const router = Router();
router.get('/master-trx-admin', async (req, res) => {
    try {
        const result = await MasterTransaction.find()
            .populate('linked_Trx_ref_1')
            .populate('linked_Trx_ref_2');
        res.status(200).send(result)
    } catch (error) {

    }

})
router.get('/all-trx', async (req, res) => {
    const result = await UserTransaction.find().sort({ createdAt: -1 });
    res.send(result)
})
// TODO: agent middleware
router.get('/agent-transactions/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;
        const query = {
            $or: [
                {
                    method: "New_user_bonus_receive",
                    receiver_phone_number: phone_number
                },
                {
                    method: "Agent_cashIn",
                    sender_phone_number: phone_number
                },
                {
                    method: "Agent_cashOut",
                    receiver_phone_number: phone_number
                },
            ]

        };
        const result = await UserTransaction.find(query).select({ "__v": 0 }).sort({ createdAt: -1 });
        res.status(200).send(result)
    } catch (error) {
        //Todo:
    }
})
router.get('/user-transactions/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;
        const query = {
            $or: [
                {
                    method: "New_user_bonus_receive",
                    receiver_phone_number: phone_number
                },
                {
                    method: "User_cashIn",
                    receiver_phone_number: phone_number
                },
                {
                    method: "sendMoney",
                    sender_phone_number: phone_number
                },
                {
                    method: "receivedMoney",
                    receiver_phone_number: phone_number
                },
                {
                    method: "User_cashOut",
                    sender_phone_number: phone_number
                },
            ]
        };
        const result = await UserTransaction.find(query).select({ "__v": 0 }).sort({ createdAt: -1 });
        res.status(200).send(result)
    } catch (error) {
        // Todo:
    }
})
export default router;