const express = require('express');
const { requireLogin } = require('./middleware');
const connectDB = require('../mongoDB');

const router = express.Router();

// Zorgt ervoor dat een value altijd als array behandeld wordt


// Checkt of 2 arrays minstens 1 overlap hebben
function hasOverlap(arr1 = [], arr2 = []) {
  return arr1.some(item => arr2.includes(item));
}

function isMatch(currentUser, candidateUser) {
  const currentGames = toArray(currentUser.favoriteGames);
  const candidateGames = toArray(candidateUser.favoriteGames);

  const currentPlatforms = toArray(currentUser.platform);
  const candidatePlatforms = toArray(candidateUser.platform);

  const currentPlaystyles = toArray(currentUser.playstyle);
  const candidatePlaystyles = toArray(candidateUser.playstyle);

  const currentLanguages = toArray(currentUser.language);
  const candidateLanguages = toArray(candidateUser.language);

  const hasSameGame = hasOverlap(currentGames, candidateGames);
  const hasSamePlatform = hasOverlap(currentPlatforms, candidatePlatforms);
  const hasSamePlaystyle = hasOverlap(currentPlaystyles, candidatePlaystyles);
  const hasSameLanguage = hasOverlap(currentLanguages, candidateLanguages);

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

    const filteredUsers = users.filter(
      user => user._id.toString() !== currentUserId
    );

    const matches = getMatches(currentUser, filteredUsers);

    const matchesWithStatus = matches.map(match => {
      const isFriends = toArray(match.friends).some(
        id => id.toString() === currentUserId
      );

      const isPending = toArray(match.friendRequests).some(
        request =>
          request &&
          request.from &&
          request.from.toString() === currentUserId &&
          request.status === 'pending'
      );

      let friendStatus = 'add';
      if (isFriends) {
        friendStatus = 'friends';
      } else if (isPending) {
        friendStatus = 'pending';
      }

      return { ...match, friendStatus };
    });

    const platformOptions = [
      ...new Set(
        matchesWithStatus.flatMap(user => toArray(user.platform)).filter(Boolean)
      )
    ];

    const languageOptions = [
      ...new Set(
        matchesWithStatus.flatMap(user => toArray(user.language)).filter(Boolean)
      )
    ];

    const playstyleOptions = [
      ...new Set(
        matchesWithStatus.flatMap(user => toArray(user.playstyle)).filter(Boolean)
      )
    ];

    res.render('pages/matches', {
      matches: matchesWithStatus,
      filters: {
        platform: platformOptions,
        language: languageOptions,
        playstyle: playstyleOptions
      }
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).render('pages/matches', {
      matches: [],
      filters: {
        platform: [],
        language: [],
        playstyle: []
      },
      error: 'Something went wrong while fetching matches. Please try again later.'
    });
  }
});

module.exports = router;