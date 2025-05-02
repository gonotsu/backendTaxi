// backend/controllers/taxiController.js
const Taxi = require('../models/Taxi');
const mongoose = require('mongoose')
// Créer un taxi
exports.createTaxi = async(req, res) => {
    try {
        const taxi = await Taxi.create(req.body);
        res.status(201).json(taxi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getTaxiById = async(req, res) => {
    try {
        const { id } = req.params
        //const taxis = await Taxi.findById({driverId:id}).populate({ path: 'driverId', select: 'name email phone' });
        const taxis = await Taxi.findOne({ driverId:id },'licensePlate model color status')
        res.json(taxis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Récupérer tous les taxis
exports.getAllTaxis = async(req, res) => {
    try {
        const taxis = await Taxi.find().populate({ path: 'driverId', select: 'name email phone' });
        res.json(taxis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mettre à jour un taxi
exports.updateTaxi = async(req, res) => {
    try {
        const { id } = req.params;
        const taxi = await Taxi.findByIdAndUpdate(id, req.body, { new: true });
        if (!taxi) {
            return res.status(404).json({ error: 'Taxi non trouvé' });
        }
        res.json(taxi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer un taxi
exports.deleteTaxi = async(req, res) => {
    try {
        const { id } = req.params;
        const taxi = await Taxi.findByIdAndDelete(id);
        if (!taxi) {
            return res.status(404).json({ error: 'Taxi non trouvé' });
        }
        res.json({ message: 'Taxi supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};