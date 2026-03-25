const express = require('express');
const { requireLogin } = require('./middleware'); 
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb'); 


const router = express.Router();

// MATCHING
// De matching is alvast neergezet en werkt nu met dummy users uit data/users.json
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

router.get('/matches', requireLogin, async (req, res) => {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find().toArray(); // alle gebruikers ophalen
    const currentUser = req.session.user; // huiden gebruiker sessie

    const filteredUsers = users.filter(user => user._id.toString() !== currentUser.id.toString());

    res.render('pages/matches', { 
        matches: filteredUsers
    });
});

module.exports = router;