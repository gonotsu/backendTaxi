// backend/controllers/rideController.js
const Ride = require('../models/Ride');

// Créer une course
exports.createRide = async(req, res) => {
    try {
        const ride = await Ride.create(req.body);
        res.status(201).json(ride);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Récupérer toutes les courses
exports.getAllRides = async(req, res) => {
    try {
        const rides = await Ride.find().populate('clientId taxiId');
        res.json(rides);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mettre à jour une course
exports.updateRide = async(req, res) => {
    try {
        const { id } = req.params;
        const ride = await Ride.findByIdAndUpdate(id, req.body, { new: true });
        if (!ride) {
            return res.status(404).json({ error: 'Course non trouvée' });
        }
        res.json(ride);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer une course
exports.deleteRide = async(req, res) => {
    try {
        const { id } = req.params;
        const ride = await Ride.findByIdAndDelete(id);
        if (!ride) {
            return res.status(404).json({ error: 'Course non trouvée' });
        }
        res.json({ message: 'Course supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};