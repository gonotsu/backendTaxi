const express = require('express');
const userController = require('../controllers/userController');
const taxiController = require('../controllers/taxiController');
const rideController = require('../controllers/rideController');
const liveLocationController = require('../controllers/locationController');
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
// Créer / mettre à jour position
router.get('/location/nearby', liveLocationController.getNearbyTaxis);
router.post('/location', liveLocationController.upsertLiveLocation);
router.get('/location/:taxiId', liveLocationController.getLiveLocationByTaxi);
router.delete('/location/:taxiId', liveLocationController.deleteLiveLocation);


// --- Users Routes ---

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/me', authMiddleware, authController.middlewareAuth)
router.post('/auth/login', authController.login)
router.post('/auth/register', authController.registers)
router.post('/users', userController.createUser);
// --- Rides Routes ---
router.post('/rides', rideController.createRide);
router.get('/rides', rideController.getAllRides);
router.put('/rides/:id', rideController.updateRide);
router.delete('/rides/:id', rideController.deleteRide);
// --- Taxis Routes ---
router.post('/taxis', taxiController.createTaxi);
router.get('/taxis', taxiController.getAllTaxis);
router.get('/taxis/:id', taxiController.getTaxiById);
router.put('/taxis/:id', taxiController.updateTaxi);
router.delete('/taxis/:id', taxiController.deleteTaxi);

module.exports = router;