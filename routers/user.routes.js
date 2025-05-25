import { Router } from "express";
import bcrypt from 'bcrypt'
import { User } from "../models/user.model.js";
const router = Router();

// Create New Account/user
router.post('/register', async (req, res) => {
    try {
        const { name, phone_number, email, PIN, NID, avatar, status, accountType } = req.body;
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

        // Create new user object
        // const newUser = 

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
        await newUser.save();
        res.status(200).json({ message: 'signup successfully' })
    } catch (error) {
        res.status(500).json({ message: `failed to signup:${error}` })
    }
})

export default router;