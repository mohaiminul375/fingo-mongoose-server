import { User } from "../models/user.model.js";

const verifyAdmin = async (req, res, next) => {
    try {
        const adminEmail = req.user.email;
        // console.log(isAdmin);
        const user = await User.findOne({ email: adminEmail });
        if (user.accountType === 'Admin') {
            next()
        }
        else {
            next('Unauthorized Access')
        }
    }
    catch (error) {
        res.status(403).json({ error: 'Authorization failed' });
    }
}
export default verifyAdmin;