import { Router } from "express";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
import { UserTransaction } from "../models/transaction.model.js"
const router = Router();
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
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
router.post('/login', async (req, res) => {
    const { emailOrPhone, PIN } = req.body;
    if (!emailOrPhone || !PIN) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        // Find user by email or phone_number
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }]
        });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user?.status === 'Blocked') {
            return res.status(403).json({ error: 'Your account is Blocked. Please contact support.' });
        }
        // Compare password with the stored hash
        const isMatch = await bcrypt.compare(PIN, user.PIN);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // generate token
        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                phone_number: user.phone_number,
                email: user.email,
                userType: user.userType,
                NID: user.NID,
                account_status: user.account_status,
                current_balance: user.current_balance,
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ success: true, token, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})
export default router;