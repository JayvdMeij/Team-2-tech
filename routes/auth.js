const express = require('express');
const bcrypt = require('bcrypt');
const connectDB = require('../mongoDB');
const { upload } = require('./middleware');

const router = express.Router();

// Route voor het tonen van de login pagina
router.get('/login', (req, res) => {
  res.render('pages/login', { error: null });
});

// Route voor het tonen van de registratie pagina
router.get('/register', (req, res) => {
  res.render('pages/register', { error: null });
});

// Oude route voor registratie, nu doorgestuurd naar /register
router.get('/registratie', (req, res) => {
  res.redirect('/register');
});

// POST route voor gebruikersregistratie
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const { username, email, password, favoriteGames, platform, language, playstyle } = req.body;

    // Controleer of alle vereiste velden zijn ingevuld
    if (!username || !email || !password || !platform || !language || !playstyle) {
      return res.status(400).render('pages/register', {
        error: 'Username, email, password, platform, language and playstyle are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // Controleer of de gebruiker al bestaat op basis van email of username
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    });

    if (existingUser) {
      return res.status(400).render('pages/register', {
        error: existingUser.email === normalizedEmail
          ? 'An account with this email address already exists.'
          : 'This username is already taken.'
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

    // Hash het wachtwoord voor beveiliging
    const hashedPassword = await bcrypt.hash(password, 10);

    // Maak een nieuw gebruikersobject aan
    const newUser = {
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      avatar: req.file ? req.file.filename : null,
      favoriteGames: parsedFavoriteGames,
      platform,
      language,
      playstyle,
      createdAt: new Date()
    };

    // Voeg de nieuwe gebruiker toe aan de database
    await usersCollection.insertOne(newUser);

    const { autoLogin } = req.body;

    // Als autoLogin is aangevinkt, logt de gebruiker direct in
    if (autoLogin) {
      // Stel de sessie in voor de nieuwe gebruiker
      req.session.user = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        favoriteGames: newUser.favoriteGames || [],
        platform: newUser.platform,
        language: newUser.language,
        playstyle: newUser.playstyle
      };

      req.session.success = 'Registration successful!';
      res.redirect('/dashboard');
    } else {
      req.session.success = 'Registration successful! Please log in.';
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).render('pages/register', {
      error: 'Something went wrong while creating your account.'
    });
  }
});

// POST route voor gebruikerslogin
router.post('/login', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { login, password } = req.body;

    // Controleer of login en wachtwoord zijn ingevuld
    if (!login || !password) {
      return res.status(400).render('pages/login', {
        error: 'Username/email and password are required.'
      });
    }

    const loginInput = login.trim();
    const normalizedLogin = loginInput.toLowerCase();

    // Zoek de gebruiker op basis van email of username
    const user = await usersCollection.findOne({
      $or: [
        { email: normalizedLogin },
        { username: loginInput }
      ]
    });

    if (!user) {
      return res.status(400).render('pages/login', {
        error: 'Invalid username/email or password.'
      });
    }

    // Vergelijk het ingevoerde wachtwoord met het gehashte wachtwoord
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).render('pages/login', {
        error: 'Invalid username/email or password.'
      });
    }

    // Stel de sessie in voor de ingelogde gebruiker
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

    req.session.success = 'Login successful!';
    res.redirect('/matches');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('pages/login', {
      error: 'Something went wrong while logging in.'
    });
  }
});

// POST route voor uitloggen
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;