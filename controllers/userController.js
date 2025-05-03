// backend/controllers/userController.js
const User = require('../models/User');
const Taxi = require('../models/Taxi')
/* Créer un utilisateur
exports.createUser = async(req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};*/

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
      
      // Trouver l'utilisateur pour obtenir l'ID du taxi
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Supprimer le taxi associé s'il existe
      if (user.taxi) {
          await Taxi.findByIdAndDelete(user.taxi);
      }

      // Supprimer l'utilisateur
      await User.findByIdAndDelete(id);

      res.json({ 
          message: 'Chauffeur et taxi associé supprimés avec succès',
          deletedUserId: id,
          deletedTaxiId: user.taxi || null
      });

  } catch (err) {
      res.status(500).json({ 
          error: err.message,
          message: 'Erreur lors de la suppression'
      });
  }
};
exports.createUser = async(req, res) => {
    try {
      const { prenom, name, email, phone, password, taxi } = req.body;
  
      // Validation
      const errors = [];
      if (!prenom) errors.push("Prénom requis");
      if (!name) errors.push("Nom requis");
      if (!taxi?.licensePlate) errors.push("Immatriculation requise");
      if (errors.length > 0) return res.status(400).json({ errors });
  
      // Création utilisateur
      const user = await User.create({
        prenom,
        name,
        email,
        phone,
        password,
        role: 'chauffeur'

      });
  
      // Création taxi
      const newTaxi = await Taxi.create({
        driverId: user._id,
        licensePlate: taxi.licensePlate,
        model: taxi.model,
        marque: taxi.marque,
        annee: taxi.annee
      });
  
      res.status(201).json({ user, taxi: newTaxi });
  
    } catch (error) {
      // Gestion des erreurs MongoDB
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          error: `${field} existe déjà`
        });
      }
      res.status(400).json({ error: error.message });
    }
  }
exports.getAllDrivers = async (req, res) => {
  try {
    const chauffeurs = await User.aggregate([
      { $match: { role: "chauffeur" } },
      {
        $lookup: {
          from: "taxis", // le nom de la collection dans MongoDB
          localField: "_id",
          foreignField: "driverId",
          as: "taxi"
        }
      },
      { $unwind: { path: "$taxi", preserveNullAndEmptyArrays: true } }
    ]);

    res.json(chauffeurs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  exports.updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, prenom, email, phone, password, taxi } = req.body;
  
      // Mise à jour de l'utilisateur
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  
      if (name) user.name = name;
      if (prenom) user.prenom = prenom;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (password) user.password = password; // sera hashé automatiquement avec pre('save')
  
      await user.save();
  
      let updatedTaxi = null;
  
      // Mise à jour du taxi s’il y en a
      if (taxi) {
        updatedTaxi = await Taxi.findOneAndUpdate(
          { driverId: user._id },
          {
            licensePlate: taxi.licensePlate,
            model: taxi.model,
            marque: taxi.marque,
            annee: taxi.annee
          },
          { new: true, upsert: false } // pas de création automatique ici
        );
      }
  
      res.json({ user, taxi: updatedTaxi });
  
    } catch (err) {
      // Gestion des erreurs MongoDB
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ error: `${field} existe déjà` });
      }
      res.status(500).json({ error: err.message });
    }
  };
  