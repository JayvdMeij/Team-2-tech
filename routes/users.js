const express = require('express');
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb');
const { requireLogin } = require('./middleware');

const router = express.Router();

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

// List all users (dev/debug)
router.get('/users', requireLogin, async (req, res) => {
  const db = await connectDB();
  const users = await db.collection('users').find().toArray();
  res.send(users.map(u =>
    `<a href="/user/${u._id}">${u.username}</a><br>`
  ).join(''));
});

module.exports = router;