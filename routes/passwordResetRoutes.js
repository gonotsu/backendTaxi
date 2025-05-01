const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controllers/authController')
const passwordResetController = require('../controllers/passwordResetController')
router.post('/forgotPassword', (req, res, next) => {
    console.log('Requête reçue:', req.body);
    next();
  }, passwordResetController.sendResetCode);
router.post('/verify-code',passwordResetController.verifyResetCode)
router.post('/reset-password',passwordResetController.resetPassword)
module.exports = router