// backend/controllers/rideController.js
const Ride = require('../models/Ride');
const Taxi = require('../models/Taxi')
const { sendPushNotification } = require('../services/pushService');
const axios = require('axios');
const getAddress = async (coord) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coord[1]}&lon=${coord[0]}`;
    const res = await axios.get(url, {
        headers: { 'User-Agent': 'Node.js App' }
    });
  
    return res.data.address.suburb || res.data.address.city_district || res.data.display_name;
  }
// Créer une course
exports.createRide = async(req, res) => {
    try {
        const ride = await Ride.create(req.body);
        const taxi = await Taxi.findById(ride.taxiId).populate('driverId');
        const driver = taxi?.driverId;

        if (driver?.pushToken) {
            await sendPushNotification(
                driver.pushToken,
                'Nouvelle course',
                `Une nouvelle course vous a été assignée`
            );
        }
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
exports.getUserRides = async(req, res) => {
    try {
        const { id } = req.params;
        const rides = await Ride.find();
        const updatUs = await Promise.all(
            rides.map(async (histo) => {
                return {
                    id: histo._id,
                    start: "alavitra",//await getAddress(histo.startLocation.coordinates),
                    end: "alavitra",//await getAddress(histo.endLocation.coordinates),
                    price: histo.price,
                };
            })
        );
        res.json(updatUs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Mettre à jour une course
exports.updateRide = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const ride = await Ride.findByIdAndUpdate(id, {status}, { new: true });
        if (!ride) {
            return res.status(404).json({ error: 'Course non trouvée' });
        }
        if (status === 'accepted') {
            const client = await User.findById(ride.clientId);
            if (client?.pushToken) {
              await sendPushNotification(
                client.pushToken,
                'Votre chauffeur arrive !',
                'Votre demande de course a été acceptée.'
              );
            }
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

const notifyDriver = async(driverId, message) => {
    const driver = await User.findById(driverId);
    if (driver ?.pushToken) {
        await sendPushNotification(driver.pushToken, 'Nouvelle course', message);
    }
};