require('dotenv').config();

const http = require('http');                    
const { Server } = require('socket.io');        

const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('./mongoDB');
const { ObjectId } = require('mongodb');

const app = express();
const server = http.createServer(app);          
const io = new Server(server);                  
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
  res.locals.success = req.session.success;
  delete req.session.success;
  next();
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Each logged-in user joins a personal room by their user ID.
// On join we also check MongoDB for pending friend requests
// that arrived while the user was offline.
io.on('connection', (socket) => {
  socket.on('join', async (userId) => {
    socket.join(userId);

    // Push pending friend requests to the user
    try {
      const db = await connectDB();
      const user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
      });

      const pending = (user?.friendRequests || []).filter(
        (r) => r.status === 'pending'
      );

      if (pending.length > 0) {
        socket.emit('pending-requests', pending);
      }
    } catch (err) {
      console.error('Socket join — failed to fetch pending requests:', err);
    }
  });
});

app.use('/', require('./routes/index'));

app.use((req, res) => {
  res.status(404).render('pages/404');
});

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server draait op http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });