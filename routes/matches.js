const express = require('express');
const { requireLogin } = require('./middleware'); 
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb'); 

const router = express.Router();

// MATCHING
// De matching logica laat zien of de gebruiker minstens 1 overeenkomst heeft met een andere gebruiker.

function isMatch(currentUser, candidateUser) {
  const currentGames = currentUser.favoriteGames || [];
  const candidateGames = candidateUser.favoriteGames || [];

  const hasSameGame = candidateGames.some(game => currentGames.includes(game));

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
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const users = await usersCollection.find().toArray();
    const currentUser = req.session.user;
    const currentUserId = currentUser.id.toString();

    // Filter out the current user
    const filteredUsers = users.filter(user => user._id.toString() !== currentUserId);

    const matches = getMatches(currentUser, filteredUsers);

    // For each match, determine the friendship status so the playerCard
    // knows which button to show: 'add', 'pending', or 'friends'
    const matchesWithStatus = matches.map(match => {
      const matchIdStr = match._id.toString();

      // Check if already friends (current user is in match's friends array)
      const isFriends = (match.friends || []).some(
        (id) => id.toString() === currentUserId
      );

      // Check if request already sent (current user is in match's friendRequests)
      const isPending = (match.friendRequests || []).some(
        (r) => r.from.toString() === currentUserId && r.status === 'pending'
      );

      let friendStatus = 'add';
      if (isFriends) friendStatus = 'friends';
      else if (isPending) friendStatus = 'pending';

      return { ...match, friendStatus };
    });

    res.render('pages/matches', {
      matches: matchesWithStatus
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).render('pages/matches', {
      matches: [],
      error: 'Something went wrong while fetching matches. Please try again later.'
    });
  }
});

module.exports = router;