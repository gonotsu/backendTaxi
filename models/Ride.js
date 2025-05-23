const mongoose = require('mongoose')
const rideSchema = new mongoose.Schema({
    clientId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    taxiId: { type: mongoose.Types.ObjectId, ref: "Taxi", required: true },
    startLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true },
        destination: String
    },
    endLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true },
        destination: String,
    },
    distanceKm: Number,
    price: Number,
    heure: String,
    status: { type: String, enum: ['en attente', 'en cours', 'terminé', 'annulé'], default: 'en attente' },
}, { timestamps: true });

rideSchema.index({ startLocation: "2dsphere" });
rideSchema.index({ endLocation: "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);