const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const SECRET = "dhfbiweufiuwehifuo3738638229rheofksehefoihsedjvbksd";
const OTP_EXPIRATION_MINUTES = 10;

const otpStorage = new Map()

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "misedratiana@gmail.com",
        pass: "legk akha xlmq jvip"
      }
    });
    await transporter.sendMail({
        from: "misedratiana@gmail.com",
        to,
        subject,
        html
      });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification de l'email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email incorrect' });
    }

    // Vérification du mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Génération du token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );

    // Réponse avec user + token
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name // si disponible
      }
    });

  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
exports.middlewareAuth = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // pas de mdp
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
}
exports.registers = async (req, res) => {
    const { name, email, password, phone } = req.body;


    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    try {
    
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé" });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60000);
        otpStorage.set(email,{
            name,
            email,
            password,
            phone,
            otp,
            otpExpires,
            attempts: 0
        })
        const emailHtml = `
        <h2>Vérification de votre compte</h2>
        <p>Bonjour ${name},</p>
        <p>Voici votre code de vérification :</p>
        <h1 style="text-align:center;">${otp}</h1>
        <p>Ce code expirera dans ${OTP_EXPIRATION_MINUTES} minutes.</p>
        <p>Si vous n'avez pas demandé cette inscription, veuillez ignorer cet email.</p>
      `;
      await sendEmail(email,"Verification de votre compte",emailHtml)
      res.status(200).json({ 
        message: "Un code de vérification a été envoyé à votre adresse email",
        email: email
      });


     

    }   catch (err) {
        console.error("Erreur détaillée lors de l'inscription:", err);
        
        // Meilleure gestion des erreurs
        if (err.message.includes("Échec de l'envoi de l'email")) {
          return res.status(500).json({ error: "Échec de l'envoi du code de vérification" });
        }
        
        res.status(500).json({ 
          error: "Erreur lors de l'inscription",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
};
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
      return res.status(400).json(storedData);
    }

    if (new Date() > storedData.otpExpires) {
      otpStorage.delete(email);
      return res.status(400).json({ error: "Le code a expiré" });
    }

    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      if (storedData.attempts >= 3) {
        otpStorage.delete(email);
        return res.status(400).json({ error: "Trop de tentatives, veuillez recommencer" });
      }
      return res.status(400).json({ error: "Code incorrect" });
    }

    // Création de l'utilisateur après vérification OTP
    const user = await User.create({
      name: storedData.name,
      email: storedData.email,
      password: storedData.password, // Déjà haché
      phone: storedData.phone,
      isVerified: true
    });

    otpStorage.delete(email); // Nettoyer après utilisation

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "Inscription réussie",
      user: userResponse
    });

  } catch (err) {
    console.error("Erreur lors de la vérification OTP:", err);
    res.status(500).json({ error: "Erreur lors de la vérification" });
  }
};
// Ajoutez cette nouvelle méthode à vos exports existants
exports.logout = async (req, res) => {
  try {
    res.json({ 
      message: "Déconnexion réussie",
      success: true
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
};