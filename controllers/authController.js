const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SECRET = "dhfbiweufiuwehifuo3738638229rheofksehefoihsedjvbksd";

exports.register = async(req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(400).json({ error: 'Email already used or invalid data' });
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
};

exports.middlewareAuth = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // pas de mdp
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}