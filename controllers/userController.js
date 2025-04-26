// backend/controllers/userController.js
const User = require('../models/User');
// Créer un utilisateur
exports.createUser = async(req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getUserById = async(req, res) => {
    try {
        const { id } = req.params;
        const users = await User.findById(id);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Mettre à jour un utilisateur
exports.updateUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, req.body, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer un utilisateur
exports.deleteUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};