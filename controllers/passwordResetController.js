const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User'); 

const resetCodes = new Map()
exports.sendResetCode = async(req,res) =>{
    const {email} = req.body
    try {
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({ message: "Email non trouvé" });
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetCodes.set(email, code);
    
        const transporter = nodemailer.createTransport({
            service : 'gmail',
            auth : {
                user : 'andranaapp@gmail.com',
                pass : 'tbfj mikf cbsj gqoy'
            }
        })
        await transporter.sendMail({
            from : 'andranaapp@gmail.com',
            to : email,
            subject : "Code de reinitialisation",
            text: `Votre code de vérification est : ${code}`
        })
        res.json({ message: "Code envoyé" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}
exports.verifyResetCode = async(req,res) =>{
    const {email, code} = req.body
    try {
        const savedCode = resetCodes.get(email)
        if(!savedCode || savedCode !== code){
            return res.status(400).json({ error: "Code invalide ou expiré" });
        }
        res.json({ message: "Code vérifié" })
        
    } catch (err) {
        res.status(500).json({ error: err.message }); 
    }
}
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

        user.password = newPassword; // <- pas de hash ici
        await user.save(); // le hash sera appliqué automatiquement par le pre('save')
        
        resetCodes.delete(email);
        res.json({ message: "Mot de passe mis à jour" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
