const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controllers/authController')
const {registers, login} = require('../controllers/authController')
router.post('/creerUsers',registers)
router.post('/login',login)
router.get('/me', authMiddleware, authController.middlewareAuth)
module.exports = router