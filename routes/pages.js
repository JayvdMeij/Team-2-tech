const express = require('express')
const router = express.Router()

const data = require('../credentials.json')


router.get('/', (req, res) => {
  res.render('pages/index')
})

router.get('/about', (req, res) => {
  res.render('pages/about')
})

router.get('/zoekbalk', (req, res) => {
  res.render('pages/zoekbalk')
})

router.get('/contact', (req, res) => {
  res.render('pages/contact')
})

router.post('/contact', (req, res) => {
  const name = req.body.name
  const email = req.body.email
  const message = req.body.message

  var contactMessage = `bericht van ${name} - ${email}: ${message}`

  console.log(contactMessage)

  res.render('pages/contact', {
    success: `Bedankt voor je bericht, ${name}! We nemen zo snel mogelijk contact met je op.`
  })
})

router.get('/registratie', (req, res) => {
  res.render('pages/registratie', {
    error: null
  })
})

router.post('/registratie', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  const user = data.users.find(u =>
    u.username === username && u.password === password
  )

  if (user) {
    res.render('pages/welcome', { username })
  } else {
    res.render('pages/registratie', {
      error: 'Ongeldige gebruikersnaam of wachtwoord'
    })
  }
})


module.exports = router
