const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const connectDB = require('../mongoDB');

const router = express.Router();

// GET route voor het tonen van de "wachtwoord vergeten" pagina
router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    error: null,
    success: null,
    resetLink: null
  });
});

// POST route voor het aanvragen van een wachtwoord reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const email = (req.body.email || '').toLowerCase().trim();

    // Controleer of email is ingevuld
    if (!email) {
      return res.status(400).render('pages/forgot-password', {
        error: 'Email is required.',
        success: null,
        resetLink: null
      });
    }

    // Zoek de gebruiker op basis van email
    const user = await usersCollection.findOne({ email });

    // Als gebruiker niet bestaat, geef een algemene boodschap (voor beveiliging)
    if (!user) {
      return res.render('pages/forgot-password', {
        error: null,
        success: 'If this email exists, a reset link is ready.',
        resetLink: null
      });
    }

    // Genereer een unieke reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Stel de vervaldatum in op 30 minuten vanaf nu
    const resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

    // Update de gebruiker met de reset token en vervaldatum
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiresAt
        }
      }
    );

    // Toon de reset link aan de gebruiker
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

// GET route voor het tonen van de wachtwoord reset pagina met token
router.get('/reset-password/:token', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { token } = req.params;

    // Controleer of de token geldig is en niet verlopen
    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    // Als token ongeldig of verlopen, toon foutmelding
    if (!user) {
      return res.status(400).render('pages/reset-password', {
        error: 'This reset link is invalid or has expired.',
        success: null,
        token,
        validToken: false
      });
    }

    // Toon de reset pagina met geldige token
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

// POST route voor het daadwerkelijk resetten van het wachtwoord
router.post('/reset-password/:token', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const { token } = req.params;
    const { password } = req.body;

    // Controleer of wachtwoord is ingevuld
    if (!password) {
      return res.status(400).render('pages/reset-password', {
        error: 'Password is required.',
        success: null,
        token,
        validToken: true
      });
    }

    // Controleer opnieuw of de token geldig is
    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    // Als token ongeldig, toon foutmelding
    if (!user) {
      return res.status(400).render('pages/reset-password', {
        error: 'This reset link is invalid or has expired.',
        success: null,
        token,
        validToken: false
      });
    }

    // Hash het nieuwe wachtwoord
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update het wachtwoord en verwijder de reset token
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

    // Toon succesmelding
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