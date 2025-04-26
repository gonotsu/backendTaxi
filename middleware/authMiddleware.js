const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token manquant' });

    try {
        const decoded = jwt.verify(token, "dhfbiweufiuwehifuo3738638229rheofksehefoihsedjvbksd" || 'secret');
        req.user = decoded; // Contient les infos comme id, email, role
        next();
    } catch (err) {
        res.status(403).json({ error: 'Token invalide' });
    }
};

module.exports = authMiddleware;