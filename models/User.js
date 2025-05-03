const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    prenom: { type: String, required: function() { return this.role === 'chauffeur'; } },
    role: { type: String, enum: ['client', 'chauffeur'], default: 'client' },
    isVerified: { type: Boolean, default: false },
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 👇 Champ virtuel pour récupérer le taxi lié
userSchema.virtual('taxi', {
    ref: 'Taxi',
    localField: '_id',
    foreignField: 'driverId',
    justOne: true
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
