const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const connectDB = require('../mongoDB');

const router = express.Router();

router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    error: null,
    success: null,
    resetLink: null
  });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const email = (req.body.email || '').toLowerCase().trim();

    if (!email) {
      return res.status(400).render('pages/forgot-password', {
        error: 'Email is required.',
        success: null,
        resetLink: null
      });
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.render('pages/forgot-password', {
        error: null,
        success: 'If this email exists, a reset link is ready.',
        resetLink: null
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiresAt
        }
      }
    );

    res.render('pages/forgot-password', {
      error: null,
      success: 'Use the reset link below to choose a new password.',
      resetLink: `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).render('pages/forgot-password', {
      error: 'Something went wrong while requesting a new password.',
      success: null,
      resetLink: null
    });
  }
});

router.get('/reset-password/:token', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { token } = req.params;

    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).render('pages/reset-password', {
        error: 'This reset link is invalid or has expired.',
        success: null,
        token,
        validToken: false
      });
    }

    res.render('pages/reset-password', {
      error: null,
      success: null,
      token,
      validToken: true
    });
  } catch (error) {
    console.error('Reset password page error:', error);
    res.status(500).render('pages/reset-password', {
      error: 'Something went wrong while opening the reset page.',
      success: null,
      token: req.params.token,
      validToken: false
    });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).render('pages/reset-password', {
        error: 'Password is required.',
        success: null,
        token,
        validToken: true
      });
    }

    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).render('pages/reset-password', {
        error: 'This reset link is invalid or has expired.',
        success: null,
        token,
        validToken: false
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          resetToken: '',
          resetTokenExpiresAt: ''
        }
      }
    );

    res.render('pages/reset-password', {
      error: null,
      success: 'Your password has been updated. You can now log in.',
      token,
      validToken: false
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).render('pages/reset-password', {
      error: 'Something went wrong while resetting your password.',
      success: null,
      token: req.params.token,
      validToken: true
    });
  }
});

module.exports = router;