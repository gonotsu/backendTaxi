const mongoose = require('mongoose')
const connectDB = async() =>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("connecter a mongoo")
    } catch (err) {
        console.error("Erreur serveur",err)
        process.exit(1)
    }
}
module.exports = connectDB