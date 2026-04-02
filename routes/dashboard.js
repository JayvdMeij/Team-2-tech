const express = require('express');
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb');
const { requireLogin } = require('./middleware');
const { upload } = require('./middleware');


const router = express.Router();

router.get('/dashboard', requireLogin, async (req, res) => {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({
    _id: new ObjectId(req.session.user.id)
  });

  if (!user) {
    return res.status(404).send('User not found');
  }

  const success = req.session.success;
  delete req.session.success;

  res.render('partials/dashboard', { user: req.session.user, success });
});

router.get('/dashboard/edit', requireLogin, async (req, res) => {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({
    _id: new ObjectId(req.session.user)
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  res.render('partials/dashboard-edit', { user: req.session.user });
});
router.post('/dashboard/edit', requireLogin, upload.fields([ { name: 'avatar', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    try {
      const db = await connectDB();
      const usersCollection = db.collection('users');
      const { username, bio, favoriteGames } = req.body;

      let parsedFavoriteGames = [];
      if (favoriteGames) {
        try {
          parsedFavoriteGames = JSON.parse(favoriteGames);
        } catch {
          parsedFavoriteGames = [];
        }
      }

      const updateData = {
        username: username.trim(),
        bio: bio.trim(),
        platform: Array.isArray(req.body.platform) ? req.body.platform : [],
        language: Array.isArray(req.body.language) ? req.body.language : [],
        playstyle: Array.isArray(req.body.playstyle) ? req.body.playstyle : [],
        favoriteGames: parsedFavoriteGames

      };

      // Avatar upload
      if (req.files.avatar) {
        updateData.avatar = req.files.avatar[0].filename
      }

      // Thumbnail upload
      if (req.files.thumbnail) {
        updateData.thumbnail = req.files.thumbnail[0].filename
      }
    

      await usersCollection.updateOne(
        { _id: new ObjectId(req.session.user) },
        { $set: updateData }
      );

      // Update session
      Object.assign(req.session.user, updateData);
console.log('Updated user data:', req.session.user);
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).send('Something went wrong while updating your profile.');
    }
  }
);

module.exports = router;
