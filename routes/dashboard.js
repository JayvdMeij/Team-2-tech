const express = require('express');
const connectDB = require('../mongoDB');
const { ObjectId } = require('mongodb');
const { requireLogin } = require('./middleware');

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

  res.render('partials/dashboard', { user: req.session.user });
});

module.exports = router;