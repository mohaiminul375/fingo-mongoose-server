import { Router } from "express";
import { UserTransaction } from "../models/transaction.model.js";

const router = Router();

router.get('/agent-transactions/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;
        const query = {
            method: "Agent_cashIn",
            sender_phone_number: phone_number
        };
        const result = await UserTransaction.find(query).select({"__v":0});
        res.status(200).send(result)
    } catch (error) {

    }
})
export default router;