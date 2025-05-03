const mongoose = require('mongoose')
const taxiSchema = new mongoose.Schema({
    driverId: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },
    licensePlate: { type: String, required: true, unique: true },
    model: String,
    marque: String,
    annee: {
        type: Number,
        min: 2000,
        max: new Date().getFullYear(),
        required: true
    },

    status: { type: String, enum: ['disponible', 'occupé', 'hors service'], default: 'disponible' },
});

module.exports = mongoose.model("Taxi", taxiSchema);