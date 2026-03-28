const express = require('express');
const { requireLogin } = require('./middleware'); 
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb'); 

const router = express.Router();

// MATCHING
// De matching logica laat zien of de gebruiker minstens 1 overeenkomst heeft met een andere gebruiker.

// Functie om te controleren of er een match is tussen twee gebruikers
function isMatch(currentUser, candidateUser) {
  const currentGames = currentUser.favoriteGames || [];
  const candidateGames = candidateUser.favoriteGames || []; // Opruimen naar favoriteGames voor consistentie

  const hasSameGame = candidateGames.some(game => currentGames.includes(game));

  // Check platform
  const hasSamePlatform =
    currentUser.platform &&
    candidateUser.platform &&
    currentUser.platform === candidateUser.platform;

  // Check playstyle
  const hasSamePlaystyle =
    currentUser.playstyle &&
    candidateUser.playstyle &&
    currentUser.playstyle === candidateUser.playstyle;

  // Check language
  const hasSameLanguage =
    currentUser.language &&
    candidateUser.language &&
    currentUser.language === candidateUser.language;

  // match? return true
  return hasSameGame || hasSamePlatform || hasSamePlaystyle || hasSameLanguage;
}

function getMatches(currentUser, users) {
  return users.filter(user => isMatch(currentUser, user));
}

router.get('/matches', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const users = await usersCollection.find().toArray();
    const currentUser = req.session.user;

    const filteredUsers = users.filter(user => user._id.toString() !== currentUser.id.toString());

    const matches = getMatches(currentUser, filteredUsers);

    // render matches pagina met gevonden matches
    res.render('pages/matches', {
      matches: matches
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).render('pages/matches', {
      error: 'Er ging iets mis gegaan bij de matching.'
    });
  }
});

module.exports = router;