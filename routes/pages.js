const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('../mongoDB');

const router = express.Router();
const uploadsPath = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/', (req, res) => {
  res.render('pages/home');
});

router.get('/about', (req, res) => {
  res.render('pages/about');
});

router.get('/zoekbalk', (req, res) => {
  res.render('pages/zoekbalk');
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', { success: null });
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const contactMessage = `bericht van ${name} - ${email}: ${message}`;

  console.log(contactMessage);

  res.render('pages/contact', {
    success: `Bedankt voor je bericht, ${name}! We nemen zo snel mogelijk contact met je op.`
  });
});

router.get('/login', (req, res) => {
  res.render('partials/login', { error: null });
});

router.get('/register', (req, res) => {
  res.render('partials/register', { error: null });
});

router.get('/registratie', (req, res) => {
  res.redirect('/register');
});

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const { username, email, password, favoriteGames } = req.body;

    if (!username || !email || !password) {
      return res.status(400).render('partials/register', {
        error: 'Username, email en password zijn verplicht.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).render('partials/register', {
        error: 'Er bestaat al een account met dit e-mailadres.'
      });
    }

    let parsedFavoriteGames = [];
    if (favoriteGames) {
      try {
        parsedFavoriteGames = JSON.parse(favoriteGames);
      } catch {
        parsedFavoriteGames = [];
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: req.file ? req.file.filename : null,
      favoriteGames: parsedFavoriteGames,
      createdAt: new Date()
    };

    await usersCollection.insertOne(newUser);
    res.redirect('/login');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).render('partials/register', {
      error: 'Er ging iets mis bij het aanmaken van je account.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('partials/login', {
        error: 'Email en password zijn verplicht.'
      });
    }

    const user = await usersCollection.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).render('partials/login', {
        error: 'Ongeldig e-mailadres of wachtwoord.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).render('partials/login', {
        error: 'Ongeldig e-mailadres of wachtwoord.'
      });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      favoriteGames: user.favoriteGames || []
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('partials/login', {
      error: 'Er ging iets mis tijdens het inloggen.'
    });
  }
});

router.get('/dashboard', requireLogin, (req, res) => {
  res.render('partials/dashboard', { user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/api/games-search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();

    if (!query || !process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=8`;
    const response = await fetch(url);
    const data = await response.json();

    const games = (data.results || []).map((game) => ({
      id: game.id,
      name: game.name,
      released: game.released || 'Unknown',
      background_image: game.background_image || ''
    }));

    res.json(games);
  } catch (error) {
    console.error('RAWG search error:', error);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

router.get('/api/background-games', async (req, res) => {
  try {
    if (!process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&page_size=40&ordering=-rating`;
    const response = await fetch(url);
    const data = await response.json();

    const games = (data.results || [])
      .filter((game) => game.background_image)
      .map((game) => ({
        id: game.id,
        name: game.name,
        image: game.background_image
      }));

    res.json(games);
  } catch (error) {
    console.error('Background games error:', error);
    res.status(500).json({ error: 'Failed to fetch background games.' });
  }
});

module.exports = router;
