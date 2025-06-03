import { Router } from "express";
import { UserTransaction } from "../models/transaction.model.js";

const router = Router();
// TODO: agent middleware
router.get('/agent-transactions/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;
        const query = {
            method: "Agent_cashIn",
            sender_phone_number: phone_number
        };
        const result = await UserTransaction.find(query).select({ "__v": 0 }).sort({ createdAt: -1 });
        res.status(200).send(result)
    } catch (error) {

    }
})
router.get('/user-transactions/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;
        const query = {
            method: "User_cashIn",
            receiver_phone_number: phone_number
        };
        const result = await UserTransaction.find(query).select({ "__v": 0 }).sort({ createdAt: -1 });
        res.status(200).send(result)
    } catch (error) {

    }
})
export default router;