import jwt from 'jsonwebtoken'
const authenticateUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    // console.log(token, 'token got')
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        // Decode and verify the token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        // console.log(verified)

        next();
    } catch (err) {
        res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};
export default authenticateUser;