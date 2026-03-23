const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('pages/index');
});

router.get('/about', (req, res) => {
  res.render('pages/about');
});

router.get('/zoekbalk', (req, res) => {
  res.render('pages/zoekbalk');
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', { success: null });
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const contactMessage = `bericht van ${name} - ${email}: ${message}`;

  console.log(contactMessage);

  res.render('pages/contact', {
    success: `Bedankt voor je bericht, ${name}! We nemen zo snel mogelijk contact met je op.`
  });
});

module.exports = router;
