// models/LiveLocation.js
const mongoose = require('mongoose');

const LiveLocationSchema = new mongoose.Schema({
    taxiId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxi',
        required: true,
    },
    location: {
        type: {
            type: String, // "Point"
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// 👇 index pour requête géospatiale
LiveLocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LiveLocation', LiveLocationSchema);