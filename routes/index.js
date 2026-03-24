const express = require('express');
const router = express.Router();

const pagesRouter = require('./pages');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const matchesRouter = require('./matches');
const usersRouter = require('./users');
const apiRouter = require('./api');
const passwordResetRouter = require('./password-reset');

router.use(pagesRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(matchesRouter);
router.use(usersRouter);
router.use(apiRouter);
router.use(passwordResetRouter);

module.exports = router;