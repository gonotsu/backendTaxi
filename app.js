// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const appRoutes = require('./routes/routes');
const passwordRoutes = require('./routes/passwordResetRoutes')
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taxiii')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Routes
app.use('/api', appRoutes);
app.use('/password',passwordRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});