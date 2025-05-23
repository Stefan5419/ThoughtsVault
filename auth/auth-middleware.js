const jwt = require('jsonwebtoken');
require('dotenv').config();

const Methods = {
    authenticateToken: (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "You must be logged on" });
        }
        jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Invalid token" });
            }
            req.userInfo = user;
            next();
        })
    }
}

module.exports = Methods;