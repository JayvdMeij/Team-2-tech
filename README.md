# GameMatch (Team 2)

Korte beschrijving:
GameMatch is een Node.js + Express + EJS applicatie om gamers te matchen, met registratie, login, profiel en realtime notificaties.

## 📚 Project-structuur

- `app.js`: Express-setup, middleware, sessies en Socket.IO.
- `routes/`: route handlers per domein:
  - `auth.js`: registratie/login/logout + sessies.
  - `pages.js`: homepage route.
  - `dashboard.js`: dashboard & profiel bewerken.
  - `matches.js`: matches pagina + API.
  - `users.js`: gebruikersfunctionaliteit.
  - `api.js`: JSON endpoints (favoriete games, friend request count, etc.).
  - `password-reset.js`: vergeten wachtwoord / reset
  - `middleware.js`: auth guard (`requireLogin`)
- `views/`:
  - `pages/`: pagina's (index.ejs, login.ejs, register.ejs, matches.ejs, dashboard.ejs, forgot-password.ejs, reset-password.ejs, enz.)
  - `partials/`: header/footer/forms/cards herbruikbaar.
- `public/`:
  - `styles/style.css`:  volgende thema’s, formulier styling, alerts, upload component.
  - `js/`: form handling en realtime updates.
- `uploads/`: avatar/thumbnail opgeslagen door multer.
- `mongoDB.js`: MongoDB connectie functie.

## 🚀 Functionaliteit overzicht

1. Gebruiker registreert (`/register`)
   - invoer: username, email, wachtwoord, platform/language/playstyle,
   - upload avatar met preview.
   - optioneel: auto login checkbox.
   - server: controle op unieke email/gebruikersnaam, bcrypt.
   - als auto-login: `req.session.user` gevuld en redirect naar `/dashboard`.
   - anders: redirect naar `/login` met succesmelding.

2. Gebruiker logt in (`/login`)
   - zoekt gebruiker op email of username.
   - bcrypt compare wachtwoord.
   - indien goed: `req.session.user` + redirect `/dashboard`.

3. Dashboard (`/dashboard`)
   - pagina toont huidige gebruiker en data.
   - succesmelding via `res.locals.success` (flash style).

4. Avatar upload preview
   - `public/js/register.js` beheert file input + preview.
   - als bestand gekozen: `file-upload` verdwijnt, preview verschijnt.
   - remove knopt reset en toont upload weer.

5. Realtime notifications via Socket.IO
   - `public/js/notifications.js`: join per user ID, luister naar `friend-request` en `friend-accepted`.
   - update `inbox-badge` en popups.

6. Wachtwoord reset
   - `routes/password-reset.js` + `views/pages/forgot-password.ejs` + `views/pages/reset-password.ejs`.
   - flow token via mail (bestaande logic in project).

## 🛠️ Belangrijke code-annotaties voor beginners

### `app.js`
- `app.use(express.urlencoded({ extended: true }))` maakt POST body beschikbaar onder `req.body`.
- `express-session` geeft `req.session` object per bezoeker.
- `res.locals.currentUser = req.session.user || null` maakt `currentUser` bruikbaar in elke EJS.
- `io.on('connection', socket => ...)` regels zorgen dat realtime events werken.

### `routes/auth.js`
- `router.post('/register', upload.single('avatar'), async ...)` multer middleware leest `req.file`.
- vraag `const { autoLogin } = req.body;` om te bepalen of uitvoering login + redirect dashboard of login pagina.
- `req.session.user = { ... }` = gebruiker ingelogd houden.

### `views/pages/login.ejs` en `register.ejs`
- `if (error)` en `if (success)` tonen meldingen naar gebruiker.
- `include('../partials/log-form')` en `reg-form` hergebruikt de forms.

### `public/js/register.js`
- frontend validatie + 2-step form.
- token: `registerStep1` / `registerStep2` toggles.
- `avatarInput.addEventListener('change', ...)` maakt preview + hide file upload.

### `public/styles/style.css`
- `#authError` / `#authSuccess` styling.
- `.file-upload` layout.
- `.auto-login-option` nieuw element voor checkbox.

## 🧾 Installatie / starten

1. `git clone <repo>`
2. `cd Team-2-tech`
3. `npm install`
4. Maak `.env`:
   - `MONGODB_URI=...`
   - `SESSION_SECRET=...`
   - `RAWG_API_KEY=...`
5. `node app.js`
6. open `http://localhost:3000`

## ▶️ Extra tips voor beginners

- Zoek in de code naar `req.session.user` om te begrijpen waar login conditie zit.
- `routes/middleware.js` heeft `requireLogin` (filters route toegang).
- Kijk in `views/partials/header.ejs` hoe er conditioneel links worden getoond op `currentUser`.
- Voor nieuwe routes: maak `routes/nieuw.js`, `views/pages/nieuw.ejs`, en `router.use(nieuwRouter)` in `routes/index.js`.

## 🧹 Commit structuur (voor goede workflow)

1. feature: `auth` (= login/register)
2. feature: `avatar upload + badges`
3. feature: `chat / friend request` (realtime)
4. clean: `README updates`, `route comments`

---

*Written for a learner: leestip — begin met route + view, dan frontend JS, dan backend flow.*
