import { Router } from "express";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
import { UserTransaction } from "../models/transaction.model.js"
const router = Router();
import { v4 as uuidv4 } from 'uuid'
// Create New Account/user
router.post('/register', async (req, res) => {
    try {
        const { name, phone_number, email, PIN, NID, avatar, status, accountType, current_balance } = req.body;
        // Check duplicate
        const existingUser = await User.findOne({
            $or: [{ phone_number }, { email }, { NID }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Phone number, email, or NID already exists."
            });
        }
        // Hash the PIN
        const hashedPIN = bcrypt.hashSync(PIN, 10);
        const newUser = new User({
            name,
            phone_number,
            email,
            accountType,
            avatar,
            status,
            NID,
            PIN: hashedPIN,
        })
        const savedUser = await newUser.save();
        if (savedUser) {
            const bonusAmount = savedUser.current_balance;
            const trx_id = uuidv4().slice(0, 10);
            const newTrx = [{
                TrxID: trx_id,
                method: 'New_user_bonus_send',
                sender_name: 'Fingo-mfs',
                sender_phone_number: 'Fingo-mfs@support',
                receiver_name: name,
                receiver_phone_number: phone_number,
                amount: bonusAmount
            }, {
                TrxID: trx_id,
                method: 'New_user_bonus_receive',
                sender_name: 'Fingo-mfs',
                sender_phone_number: 'Fingo-mfs@support',
                receiver_name: name,
                receiver_phone_number: phone_number,
                amount: bonusAmount
            }]
            await UserTransaction.insertMany(newTrx)
            res.status(200).json({ success: true, message: 'account created and bonus added' })
        }
        // create trx

    } catch (error) {
        res.status(500).json({ message: `failed to signup:${error}` })
    }
})

export default router;