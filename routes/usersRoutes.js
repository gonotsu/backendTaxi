const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controllers/authController')
const passwordResetController = require('../controllers/passwordResetController')
const {registers, login} = require('../controllers/authController')

//routes users
router.post('/creerUsers',(req, res, next) => {
    console.log('Requête reçue:', req.body);
    next();
  },registers)
router.post('/login',login)

router.get('/me', authMiddleware, authController.middlewareAuth)
router.post('/verifi-otp',authController.verifyOtp)
router.post('/logout',authController.logout)

//routes password
router.post('/forgotPassword', (req, res, next) => {
    console.log('Requête reçue:', req.body);
    next();
  }, passwordResetController.sendResetCode);
router.post('/verify-code',passwordResetController.verifyResetCode)
router.post('/reset-password',passwordResetController.resetPassword)

module.exports = router