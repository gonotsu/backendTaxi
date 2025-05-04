// backend/controllers/rideController.js
const Ride = require('../models/Ride');
const User = require('../models/User');

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

exports.getRidesUser = async (req, res) => { // Added 'req' parameter
    try {
        // Utiliser l'agrégation pour filtrer par rôle ET compter les courses terminées
        const clientsWithRideCount = await User.aggregate([
          {
            // Étape 1: Filtrer les documents User par rôle 'client'
            $match: { role: 'client' }
          },
          {
            // Étape 2: Joindre (lookup) les documents Ride en utilisant clientId
            $lookup: {
              from: 'rides', // Le nom de la collection des courses dans votre DB (souvent au pluriel et en minuscules)
              localField: '_id', // Le champ dans la collection User (l'ID du client)
              foreignField: 'clientId', // Le champ dans la collection Ride (l'ID du client lié)
              as: 'clientRides' // Le nom du nouveau tableau qui contiendra les courses correspondantes
            }
          },
          {
            // Étape 3: Ajouter un nouveau champ 'ridesCount'
            $addFields: {
              // Compter le nombre d'éléments dans le tableau 'clientRides' où le statut est 'terminé'
              ridesCount: {
                $size: { // $size retourne la taille du tableau
                  $filter: { // $filter permet de filtrer les éléments d'un tableau
                    input: '$clientRides', // Le tableau d'entrée est 'clientRides'
                    as: 'ride', // Alias pour chaque élément du tableau
                    cond: { $eq: ['$$ride.status', 'terminé'] } // Condition: le statut de la course est 'terminé'
                  }
                }
              }
            }
          },
          {
            // Étape 4: Projeter les champs que vous voulez retourner
            // Inclure explicitement les champs de l'utilisateur et ridesCount.
            // clientRides est automatiquement exclu car il n'est pas inclus ici.
            $project: {
              _id: 1, // Inclure explicitement _id
              name: 1,
              email: 1,
              phone: 1,
              role: 1,
              isVerified: 1,
              createdAt: 1,
              updatedAt: 1,
              ridesCount: 1 // Inclure le champ calculé
              // clientRides: 0 // <-- Removed this line to fix the error
            }
          },

          { $sort: { ridesCount: -1 } } // Exemple: trier par nombre de courses descendant
        ]);


        res.json(clientsWithRideCount);

      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des clients.' });
      }
};


exports.getDashboardStats = async (req, res) => { // Added req, res parameters
    try {
        // Calculate start and end of today in UTC
        const today = new Date();
        // Set to start of the day in the server's local time then convert to UTC
        today.setHours(0, 0, 0, 0);
        const startOfTodayUTC = new Date(today.toISOString());

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
        const startOfTomorrowUTC = new Date(tomorrow.toISOString());


        const rideStats = await Ride.aggregate([
            {
                $match: {
                    // Match rides created today (between start of today and start of tomorrow, in UTC)
                    createdAt: {
                        $gte: startOfTodayUTC,
                        $lt: startOfTomorrowUTC
                    }
                }
            },
            {
                $group: {
                    _id: null, // Group all matching documents into one group
                    totalRidesToday: { $sum: 1 }, // Count all rides matched today
                    totalRevenueToday: {
                        $sum: {
                            $cond: { // Conditional sum
                                if: { $eq: ['$status', 'terminé'] }, // If status is 'terminé'
                                then: { $ifNull: ['$price', 0] }, // Sum the price (treat null price as 0)
                                else: 0 // Otherwise add 0
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the _id from the group
                    totalRidesToday: 1,
                    totalRevenueToday: 1
                }
            }
        ]);

        // The aggregation result is an array. If no rides today, it will be empty.
        const dailyStats = rideStats.length > 0 ? rideStats[0] : { totalRidesToday: 0, totalRevenueToday: 0 };

        // You might also want total client count and active taxi count here or fetch separately
        // For simplicity, the frontend will fetch client count and calculate active taxi count

        res.json(dailyStats); // Send daily ride stats

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques du tableau de bord.' });
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