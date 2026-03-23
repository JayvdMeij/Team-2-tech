require('dotenv').config();

const http = require('http');                    // ADD
const { Server } = require('socket.io');        // ADD

const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('./mongoDB');

const app = express();
const server = http.createServer(app);          // ADD
const io = new Server(server);                  // ADD
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);                              // ADD

// Each logged-in user joins a personal room by their user ID
io.on('connection', (socket) => {               // ADD
  socket.on('join', (userId) => {               // ADD
    socket.join(userId);                        // ADD
  });                                           // ADD
});                                             // ADD

app.use('/', require('./routes/pages'));

app.use((req, res) => {
  res.status(404).render('pages/404');
});

connectDB()
  .then(() => {
    server.listen(port, () => {                 // CHANGED: app.listen → server.listen
      console.log(`Server draait op http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });