const express = require('express');
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb');
const { requireLogin } = require('./middleware');

const router = express.Router();

// ──────────────────────────────────────────────
//  INBOX — shows all pending friend requests
// ──────────────────────────────────────────────
router.get('/inbox', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.session.user.id)
    });

    const pendingRequests = (user?.friendRequests || []).filter(
      (r) => r.status === 'pending'
    );

    res.render('partials/inbox', {
      user: req.session.user,
      pendingRequests
    });
  } catch (err) {
    console.error('Inbox error:', err);
    res.status(500).send('Something went wrong.');
  }
});

// ──────────────────────────────────────────────
//  ACCEPT a friend request
// ──────────────────────────────────────────────
router.post('/api/friend-request/:fromId/accept', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const currentUserId = req.session.user.id.toString();
    const fromId = req.params.fromId;

    // 1) Update the request status to 'accepted'
    await usersCollection.updateOne(
      {
        _id: new ObjectId(currentUserId),
        'friendRequests.from': new ObjectId(fromId),
        'friendRequests.status': 'pending'
      },
      {
        $set: { 'friendRequests.$.status': 'accepted' }
      }
    );

    // 2) Add each user to the other's friends array (no duplicates)
    await usersCollection.updateOne(
      { _id: new ObjectId(currentUserId) },
      { $addToSet: { friends: new ObjectId(fromId) } }
    );

    await usersCollection.updateOne(
      { _id: new ObjectId(fromId) },
      { $addToSet: { friends: new ObjectId(currentUserId) } }
    );

    // 3) Notify the sender in real-time
    const io = req.app.get('io');
    io.to(fromId).emit('friend-accepted', {
      byUsername: req.session.user.username,
      byId: currentUserId,
      byAvatar: req.session.user.avatar || null
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ──────────────────────────────────────────────
//  DECLINE a friend request
// ──────────────────────────────────────────────
router.post('/api/friend-request/:fromId/decline', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const currentUserId = req.session.user.id.toString();
    const fromId = req.params.fromId;

    // Remove the friend request entirely
    await usersCollection.updateOne(
      { _id: new ObjectId(currentUserId) },
      {
        $pull: {
          friendRequests: { from: new ObjectId(fromId), status: 'pending' }
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Decline friend request error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ──────────────────────────────────────────────
//  API — pending request count (for badge)
// ──────────────────────────────────────────────
router.get('/api/friend-requests/pending-count', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(req.session.user.id)
    });

    const count = (user?.friendRequests || []).filter(
      (r) => r.status === 'pending'
    ).length;

    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

// ──────────────────────────────────────────────
//  View another user's public profile
// ──────────────────────────────────────────────
router.get('/user/:id', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const profileUser = await usersCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!profileUser) return res.status(404).send('User not found.');

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
    res.status(500).send('Something went wrong.');
  }
});

// ──────────────────────────────────────────────
//  Send a friend request
// ──────────────────────────────────────────────
router.post('/api/friend-request/:id', requireLogin, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const toId = req.params.id;
    const fromId = req.session.user.id.toString();

    if (toId === fromId) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
    }

    const targetUser = await usersCollection.findOne({ _id: new ObjectId(toId) });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const alreadySent = (targetUser.friendRequests || []).some(
      (r) => r.from.toString() === fromId
    );
    if (alreadySent) {
      return res.status(400).json({ error: 'Request already sent.' });
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
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ──────────────────────────────────────────────
//  List all users (dev/debug)
// ──────────────────────────────────────────────
router.get('/users', requireLogin, async (req, res) => {
  const db = await connectDB();
  const users = await db.collection('users').find().toArray();
  res.send(users.map(u =>
    `<a href="/user/${u._id}">${u.username}</a><br>`
  ).join(''));
});

module.exports = router;