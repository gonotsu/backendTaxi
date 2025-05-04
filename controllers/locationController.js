
const LiveLocation = require('../models/LiveLocation');
const Taxi = require('../models/Taxi'); 

exports.upsertLiveLocation = async(req, res) => {
    const { taxiId, latitude, longitude } = req.body;

    if (!taxiId || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
            error: 'Coordonnées GPS invalides ou manquantes',
            received: { taxiId, latitude, longitude }
        });
    }

    try {
        const updated = await LiveLocation.findOneAndUpdate({ taxiId }, {
            taxiId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            updatedAt: new Date()
        }, { upsert: true, new: true, runValidators: true });

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur côté serveur', detail: err.message });
    }
};


// 📍 Obtenir la position en direct d’un taxi
exports.getLiveLocationByTaxi = async(req, res) => {
    try {
        const { taxiId } = req.params;

        const location = await LiveLocation.findOne({ taxiId }).populate({
            path: 'taxiId',
            select: 'matricule',
        });

        if (!location) {
            return res.status(404).json({ message: 'Aucune localisation trouvée pour ce taxi' });
        }

        res.status(200).json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🧹 Supprimer la position d’un taxi
exports.deleteLiveLocation = async(req, res) => {
    try {
        const { taxiId } = req.params;
        await LiveLocation.findOneAndDelete({ taxiId });
        res.status(200).json({ message: 'Position supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// controllers/liveLocationController.js

exports.getNearbyTaxis = async(req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({ message: 'lat, lng et radius sont requis' });
        }

        const nearbyTaxis = await LiveLocation.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseFloat(radius) * 1000, // km → mètres
                },
            },
        }).populate({
            path: 'taxiId',
            populate: {
                path: 'driverId',
                select: 'name email phone'
            },
            select: 'licensePlate',
        });

        res.status(200).json(nearbyTaxis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// au cas où tu en aurais besoin pour d'autres traitements

exports.getAllLocation = async (req, res) => {
    try {
        // Récupère toutes les localisations en temps réel
        const liveLocations = await LiveLocation.find({})
            .populate({
                path: 'taxiId',
                select: 'status licensePlate driverId',
                populate: {
                    path: 'driverId',
                    select: 'name'
                }
            });

        // Formater les données à renvoyer (simplifier la structure pour le frontend)
        const response = liveLocations.map(loc => ({
            _id: loc._id,
            coordinates: loc.location.coordinates,
            updatedAt: loc.updatedAt,
            taxi: {
                _id: loc.taxiId._id,
                status: loc.taxiId.status,
                licensePlate: loc.taxiId.licensePlate,
                driver: {
                    _id: loc.taxiId.driverId._id,
                    name: loc.taxiId.driverId.name
                }
            }
        }));

        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des localisations en direct.' });
    }
};
