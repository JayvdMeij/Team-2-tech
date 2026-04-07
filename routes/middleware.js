const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pad naar de uploads map
const uploadsPath = path.join(__dirname, '..', 'uploads');

// Maak de uploads map aan als deze niet bestaat
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configuratie voor multer opslag (disk storage)
const storage = multer.diskStorage({
  // Bestemming voor geüploade bestanden
  destination: (req, file, cb) => cb(null, uploadsPath),
  // Genereer een unieke bestandsnaam
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

// Multer upload middleware voor enkele bestanden
const upload = multer({ storage });

// Multer upload middleware voor meerdere bestanden (zelfde configuratie)
const uploadMulti = multer({ storage });

// Middleware functie om te controleren of gebruiker ingelogd is
function requireLogin(req, res, next) {
  // Als geen gebruiker in sessie, redirect naar login
  if (!req.session.user) {
    return res.redirect('/login');
  }
  // Anders doorgaan naar volgende middleware/route
  next();
}

module.exports = { upload, uploadMulti, requireLogin };