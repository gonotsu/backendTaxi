// backend/controllers/taxiChauffeurController.js (ou un nom similaire)
const mongoose = require('mongoose'); // Assurez-vous que mongoose est installé et configuré
const User = require('../models/User'); // Assurez-vous que votre modèle User est défini
const Taxi = require('../models/Taxi'); // Assurez-vous que votre modèle Taxi est défini

// Assurez-vous que vos modèles Mongoose sont définis comme suit (exemples simplifiés)
// backend/models/User.js
/*
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Assurez-vous de hacher les mots de passe !
  phone: { type: String },
  role: { type: String, enum: ['client', 'chauffeur', 'admin'], required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
userSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
module.exports = mongoose.model('User', userSchema);
*/

// backend/models/Taxi.js
/*
const taxiSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Un taxi DOIT avoir un chauffeur
  licensePlate: { type: String, required: true, unique: true },
  model: { type: String },
  marque: { type: String },
  color: { type: String },
  status: { type: String, enum: ['disponible', 'occupé', 'hors service'], default: 'disponible' },
  location: { // Champ pour la localisation en temps réel (GeoJSON Point)
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
taxiSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
module.exports = mongoose.model('Taxi', taxiSchema);
*/


// --- Controller function to get all taxis (with driver info) ---
// Correspond à GET /api/taxis
exports.getAllTaxis = async (req, res) => {
    try {
        // Find all taxi documents
        // Populate the driverId field to include driver (User) details
        const taxis = await Taxi.find({})
            .populate('driverId', 'name email phone'); // Populate driverId and select name, email, phone

        res.json(taxis);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des taxis.' });
    }
};
// -------------------------------------------------------------

// --- Controller function to create a new User (chauffeur) and linked Taxi ---
// Correspond à POST /api/creerUsers
exports.createChauffeurAndTaxi = async (req, res) => {
    const { name, email, phone, password, licensePlate, marque, model, color, status } = req.body;

    // Basic validation (add more as needed)
    if (!name || !email || !phone || !licensePlate || !marque || !model || !color || !status) {
        return res.status(400).json({ message: 'Tous les champs requis doivent être fournis.' });
    }

    try {
        // 1. Check if user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

         // 2. Check if a taxi with this license plate already exists
        const existingTaxi = await Taxi.findOne({ licensePlate });
        if (existingTaxi) {
            return res.status(400).json({ message: 'Un taxi avec cette immatriculation existe déjà.' });
        }


        // 3. Create the new User (Chauffeur)
        // NOTE: You should hash the password before saving in a real application!
        const newChauffeur = new User({
            name,
            email,
            phone,
            password: password || Math.random().toString(36).slice(-8), // Use provided password or generate one
            role: 'chauffeur', // Explicitly set role to chauffeur
            isVerified: true // Maybe set to false initially, depends on your flow
        });

        await newChauffeur.save();

        // 4. Create the new Taxi linked to the new Chauffeur
        const newTaxi = new Taxi({
            driverId: newChauffeur._id, // Link to the newly created chauffeur
            licensePlate,
            marque,
            model,
            color,
            status,
            // location will default based on schema default value
        });

        await newTaxi.save();

        // Populate the driverId in the new taxi object before sending the response
        const populatedTaxi = await Taxi.findById(newTaxi._id).populate('driverId', 'name email phone');


        res.status(201).json(populatedTaxi); // Return the created taxi with populated driver info

    } catch (err) {
        console.error(err);
         // Handle potential Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la création du chauffeur et du taxi.' });
    }
};
// ---------------------------------------------------------------------------

// --- Controller function to update an existing Taxi and linked User (chauffeur) ---
// Correspond à PUT /api/taxis/:id
exports.updateChauffeurAndTaxi = async (req, res) => {
    const taxiId = req.params.id;
    const { name, email, phone, licensePlate, marque, model, color, status, driverId } = req.body; // Include driverId from frontend

    // Basic validation (add more as needed)
     if (!licensePlate || !marque || !model || !color || !status || !driverId) {
         return res.status(400).json({ message: 'Les champs du taxi et l\'ID du chauffeur sont requis pour la mise à jour.' });
     }
     // Basic validation for driver info if provided
     if (!name || !email || !phone) {
         return res.status(400).json({ message: 'Les informations du chauffeur (Nom, Email, Téléphone) sont requises pour la mise à jour.' });
     }


    try {
        // 1. Find the Taxi by ID
        const taxi = await Taxi.findById(taxiId);
        if (!taxi) {
            return res.status(404).json({ message: 'Taxi non trouvé.' });
        }

        // 2. Find the linked User (chauffeur) by driverId
        const chauffeur = await User.findById(driverId);
         // Double-check if the found user is actually the driver linked to this taxi (optional but safer)
        if (!chauffeur || chauffeur._id.toString() !== taxi.driverId.toString()) {
             return res.status(404).json({ message: 'Chauffeur lié non trouvé ou ne correspond pas au taxi.' });
        }
         // Ensure the user is a chauffeur
         if (chauffeur.role !== 'chauffeur') {
             return res.status(400).json({ message: 'L\'utilisateur lié n\'est pas un chauffeur.' });
         }


        // 3. Update the Taxi document
        // Check for duplicate license plate before updating if it's changed
        if (taxi.licensePlate !== licensePlate) {
             const existingTaxiWithSamePlate = await Taxi.findOne({ licensePlate });
             if (existingTaxiWithSamePlate && existingTaxiWithSamePlate._id.toString() !== taxiId) {
                 return res.status(400).json({ message: 'Un autre taxi avec cette immatriculation existe déjà.' });
             }
        }

        taxi.licensePlate = licensePlate;
        taxi.marque = marque;
        taxi.model = model;
        taxi.color = color;
        taxi.status = status;
        // taxi.updatedAt will be updated by the pre('save') hook


        // 4. Update the linked User (Chauffeur) document
         // Check for duplicate email before updating if it's changed
        if (chauffeur.email !== email) {
            const existingUserWithSameEmail = await User.findOne({ email });
            if (existingUserWithSameEmail && existingUserWithSameEmail._id.toString() !== driverId) {
                return res.status(400).json({ message: 'Un autre utilisateur avec cet email existe déjà.' });
            }
        }

        chauffeur.name = name;
        chauffeur.email = email;
        chauffeur.phone = phone;
        // chauffeur.updatedAt will be updated by the pre('save') hook


        // 5. Save both documents
        await taxi.save();
        await chauffeur.save();

        // 6. Return the updated taxi with populated driver info
        const updatedTaxi = await Taxi.findById(taxiId).populate('driverId', 'name email phone');


        res.json(updatedTaxi); // Return the updated taxi with populated driver info

    } catch (err) {
        console.error(err);
         // Handle potential Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // Handle CastError if ID is invalid
         if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de taxi ou de chauffeur invalide.' });
         }
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du chauffeur et du taxi.' });
    }
};
// -----------------------------------------------------------------------------------

// --- Controller function to delete a Taxi and its linked User (chauffeur) ---
// Correspond à DELETE /api/taxis/:id
exports.deleteChauffeurAndTaxi = async (req, res) => {
    const taxiId = req.params.id;

    try {
        // 1. Find the Taxi by ID
        const taxi = await Taxi.findById(taxiId);
        if (!taxi) {
            return res.status(404).json({ message: 'Taxi non trouvé.' });
        }

        const driverId = taxi.driverId; // Get the linked driver's ID
        // 2. Delete the Taxi document
        await Taxi.findByIdAndDelete(taxiId);

        // 3. Delete the linked User (Chauffeur) document
        // NOTE: Be careful with this step! If the driver user is linked to other things
        // besides this taxi (e.g., rides history you want to keep), you might only
        // want to unlink the taxi from the driver instead of deleting the user.
        // For this component's logic, we assume deleting the taxi means deleting the driver user.
        const deletedChauffeur = await User.findByIdAndDelete(driverId);

         if (!deletedChauffeur) {
             console.warn(`Linked driver user with ID ${driverId} not found during taxi deletion.`);
             // Continue with success response even if driver wasn't found/deleted, as the taxi is gone.
         }


        // 4. Handle related documents (Rides) - IMPORTANT!
        // When you delete a taxi and its driver, what happens to the rides associated with them?
        // - Rides where this driver was the assigned chauffeur (taxiId field)
        // - Rides created by this user if they were also a client (clientId field - less likely if role is strictly 'chauffeur')
        // You need to decide:
        // a) Delete associated Rides: await Ride.deleteMany({ taxiId: taxiId });
        // b) Unlink Rides from this taxi/driver: await Ride.updateMany({ taxiId: taxiId }, { $unset: { taxiId: "" } });
        // c) Leave Rides as is (references will be broken if IDs no longer exist)
        // This example does NOT handle related Ride documents. Add logic here based on your needs.


        res.json({ message: 'Chauffeur et taxi supprimés avec succès.', deletedTaxiId: taxiId, deletedChauffeurId: driverId });

    } catch (err) {
        console.error(err);
         // Handle CastError if ID is invalid
         if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de taxi ou de chauffeur invalide.' });
         }
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du chauffeur et du taxi.' });
    }
};
// ---------------------------------------------------------------------------

// You would then import these functions into your Express router file (e.g., backend/routes/taxiRoutes.js)
// and link them to the specific routes:
/*
const express = require('express');
const router = express.Router();
const taxiChauffeurController = require('../controllers/taxiChauffeurController'); // Adjust path as needed

router.get('/taxis', taxiChauffeurController.getAllTaxis);
router.post('/creerUsers', taxiChauffeurController.createChauffeurAndTaxi); // Note: Endpoint name from frontend
router.put('/taxis/:id', taxiChauffeurController.updateChauffeurAndTaxi);
router.delete('/taxis/:id', taxiChauffeurController.deleteChauffeurAndTaxi);

module.exports = router;
*/
