import { Router } from "express";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
import { UserTransaction } from "../models/transaction.model.js"
const router = Router();
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import authenticateUser from '../middlewares/verificationToken.js'
import verifyAdmin from "../middlewares/verifyAdmin.js";
import { MasterTransaction } from "../models/MasterTransaction.js";
import mongoose from "mongoose"





// Get all user for admin
router.get('/all-users', authenticateUser, verifyAdmin, async (req, res) => {
    const result = await User.find().select({
        __v: 0,
        PIN: 0,
    });
    res.send(result);
})
// Create New Account/user

router.post('/register', async (req, res) => {
    const session = await mongoose.startSession(); // start session
    session.startTransaction(); // begin transaction

    try {
        const { name, phone_number, email, PIN, NID, avatar, status, accountType, current_balance } = req.body;

        const existingUser = await User.findOne({
            $or: [{ phone_number }, { email }, { NID }]
        }).session(session); // session attach

        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Phone number, email, or NID already exists."
            });
        }

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
            current_balance // নিশ্চিত হও current_balance সেভ করতেছো
        });

        const savedUser = await newUser.save({ session }); // session pass

        const bonusAmount = savedUser.current_balance;
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
                method: 'New_user_bonus_send',
                sender_name: 'Fingo-mfs',
                sender_phone_number: 'Fingo-mfs@support',
                receiver_name: name,
                receiver_phone_number: phone_number,
                amount: bonusAmount,
                linked_Trx_ref: trxObjectId2,
                masterTrx_ref: masterTrxObjectId,
            },
            {
                _id: trxObjectId2,
                TrxID: trx_id_2,
                method: 'New_user_bonus_receive',
                sender_name: 'Fingo-mfs',
                sender_phone_number: 'Fingo-mfs@support',
                receiver_name: name,
                receiver_phone_number: phone_number,
                amount: bonusAmount,
                linked_Trx_ref: trxObjectId1,
                masterTrx_ref: masterTrxObjectId,
            }
        ];

        const newMasterTrx = new MasterTransaction({
            _id: masterTrxObjectId,
            Master_TrxID: master_trx_id,
            method: 'New_user_bonus_send',
            sender_name: 'Fingo-mfs',
            sender_phone_number: 'Fingo-mfs@support',
            receiver_name: name,
            receiver_phone_number: phone_number,
            amount: bonusAmount,
            linked_Trx_ref_1: trxObjectId1,
            linked_Trx_ref_2: trxObjectId2,
        });

        await UserTransaction.insertMany(newTrx, { session });
        await newMasterTrx.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'account created and bonus added' });

    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession();
        res.status(500).json({ message: `failed to signup: ${error}` });
    }
});

// Login and get token
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
                accountType: user.userType,
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
// get user data after login
router.get('/user-data', authenticateUser, async (req, res) => {
    try {
        // Find the user by email (from the decoded JWT)
        const user = await User.findOne({ email: req.user.email });
        // console.log(user,'user got');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Remove password from the user object
        const { PIN, ...userWithoutPin } = user.toObject();
        console.log(userWithoutPin)
        res.status(200).json({ user: userWithoutPin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user data" });
    }
});
export default router;