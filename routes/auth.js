const express = require('express');
const bcrypt = require('bcrypt');
const connectDB = require('../mongoDB');
const { upload } = require('./middleware');

const router = express.Router();

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

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;