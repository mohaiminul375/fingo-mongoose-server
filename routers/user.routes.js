import { Router } from "express";
import { User } from "../models/user.model.js";
const router = Router();

// Create New Account/user
router.post('/register', async (req, res) => {
    try {
        const newUser = new User(req.body)
        await newUser.save();
        res.status(200).json({ message: 'signup successfully' })
    } catch (error) {
        res.status(500).json({ message: `failed to signup:${error}` })
    }
})

export default router;