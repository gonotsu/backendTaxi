const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès interdit : rôle insuffisant' });
        }
        next();
    };
};

module.exports = restrictTo;