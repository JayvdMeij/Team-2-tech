const express = require('express');
const bcrypt = require('bcrypt');
const connectDB = require('../mongoDB');
const { upload } = require('./middleware');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('pages/login', { error: null });
});

router.get('/register', (req, res) => {
  res.render('pages/register', { error: null });
});

router.get('/registratie', (req, res) => {
  res.redirect('/register');
});

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const { username, email, password, favoriteGames, platform, language, playstyle } = req.body;

    if (!username || !email || !password || !platform || !language || !playstyle) {
      return res.status(400).render('pages/register', {
        error: 'Username, email, password, platform, language en playstyle zijn verplicht.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).render('pages/register', {
        error: 'Er bestaat al een account met dit e-mailadres.'
      });
    }

    // Verwerk de favoriete spellen
    let parsedFavoriteGames = [];
    if (favoriteGames) {
      try {
        parsedFavoriteGames = JSON.parse(favoriteGames);
      } catch {
        parsedFavoriteGames = [];
      }
    }

    // Hash het wachtwoord
    const hashedPassword = await bcrypt.hash(password, 10);

    // Maakt nieuw gebruiker object
    const newUser = {
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: req.file ? req.file.filename : null,
      favoriteGames: parsedFavoriteGames,
      platform: platform,       
      language: language,       
      playstyle: playstyle,     
      createdAt: new Date()
    };

    // Voegt nieuwe gebruiker toe aan database
    await usersCollection.insertOne(newUser);

    res.redirect('/login');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).render('pages/register', {
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
      return res.status(400).render('pages/login', {
        error: 'Email en password zijn verplicht.'
      });
    }

    const user = await usersCollection.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).render('pages/login', {
        error: 'Ongeldig e-mailadres of wachtwoord.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).render('pages/login', {
        error: 'Ongeldig e-mailadres of wachtwoord.'
      });
    }

    // gebruikersgegevens sessie
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      favoriteGames: user.favoriteGames || [],
      platform: user.platform,   
      language: user.language,   
      playstyle: user.playstyle  
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('pages/login', {
      error: 'Er ging iets mis tijdens het inloggen.'
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;