import { Router } from "express";
import { User } from "../models/user.model.js";
import { CashReq } from "../models/agentCashReq.model.js";

const router = Router();
router.get('/all-request', async (req, res) => {
    const result = await CashReq.find({status:"Pending"});
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
export default router;