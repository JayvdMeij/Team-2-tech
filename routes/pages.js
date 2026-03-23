const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb');

const dummyUsers = require('../data/users.json');

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
  res.render('pages/index');
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

router.get('/dashboard', requireLogin, async (req, res) => {
 
  const db = await connectDB();
    const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({
    _id: new ObjectId(req.session.user.id)
  });
  
  if (!user) {
    return res.status(404).send("User not found");
  }

 
  
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

// MATCHING ROUTE
// Op dit moment laat ik nog alle dummy users in de route om de frontend te testen

router.get('/matches', requireLogin, (req, res) => {
  const matches = dummyUsers;

  res.render('pages/matches', {
    user: req.session.user,
    matches
  });
});

module.exports = router;


// View another user's public profile
router.get('/user/:id', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const profileUser = await usersCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!profileUser) return res.status(404).send('Gebruiker niet gevonden.');

    const currentUserId = req.session.user.id.toString();

    // Prevent visiting your own profile
    if (currentUserId === req.params.id) return res.redirect('/dashboard');

    const alreadySent = (profileUser.friendRequests || []).some(
      (r) => r.from.toString() === currentUserId
    );

    const alreadyFriends = (profileUser.friends || []).some(
      (id) => id.toString() === currentUserId
    );

    res.render('partials/profile', {
      profileUser,
      alreadySent,
      alreadyFriends,
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Er ging iets mis.');
  }
});

// Send a friend request
router.post('/api/friend-request/:id', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const toId = req.params.id;
    const fromId = req.session.user.id.toString();

    if (toId === fromId) {
      return res.status(400).json({ error: 'Je kunt geen verzoek naar jezelf sturen.' });
    }

    const targetUser = await usersCollection.findOne({ _id: new ObjectId(toId) });
    if (!targetUser) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });

    const alreadySent = (targetUser.friendRequests || []).some(
      (r) => r.from.toString() === fromId
    );
    if (alreadySent) {
      return res.status(400).json({ error: 'Verzoek al verstuurd.' });
    }

    // Push friend request onto the receiver's document
    await usersCollection.updateOne(
      { _id: new ObjectId(toId) },
      {
        $push: {
          friendRequests: {
            from: new ObjectId(fromId),
            fromUsername: req.session.user.username,
            fromAvatar: req.session.user.avatar || null,
            status: 'pending',
            createdAt: new Date()
          }
        }
      }
    );

    // Emit real-time notification to the receiver
    const io = req.app.get('io');
    io.to(toId).emit('friend-request', {
      fromUsername: req.session.user.username,
      fromId,
      fromAvatar: req.session.user.avatar || null
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Er ging iets mis.' });
  }
});

router.get('/users', requireLogin, async (req, res) => {
  const db = await connectDB();
  const users = await db.collection('users').find().toArray();
  res.send(users.map(u =>
    `<a href="/user/${u._id}">${u.username}</a><br>`
  ).join(''));
});

// MATCHING
// De matching is alvast neergezet hieronder en werkt nu met dummy users uit data/users.json
// Later koppel ik de route aan mongoDB gebruikersdata en voorkeuren uit MongoDB/session!

// Matching laat alles waarbij de gebruiker minimaal 1 overeenkomst heeft zien!

function isMatch(currentUser, candidateUser) {
  const currentGames = currentUser.favoriteGames || [];
  const candidateGames = candidateUser.games || [];

  const hasSameGame = candidateGames.some(game =>
    currentGames.includes(game)
  );

  const hasSamePlatform =
    currentUser.platform &&
    candidateUser.platform &&
    currentUser.platform === candidateUser.platform;

  const hasSamePlaystyle =
    currentUser.playstyle &&
    candidateUser.playstyle &&
    currentUser.playstyle === candidateUser.playstyle;

  const hasSameLanguage =
    currentUser.language &&
    candidateUser.language &&
    currentUser.language === candidateUser.language;

  return hasSameGame || hasSamePlatform || hasSamePlaystyle || hasSameLanguage;
}

function getMatches(currentUser, users) {
  return users.filter(user => isMatch(currentUser, user));
}
