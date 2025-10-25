const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');

const sessionConfig = {
  store: new FileStore({
    path: path.join(__dirname, '../../data/sessions'),
    ttl: 30 * 24 * 60 * 60, // 30 days in seconds
    retries: 0,
    reapInterval: 3600, // Clean up expired sessions every hour
  }),
  secret: process.env.SESSION_SECRET || 'collision-os-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  name: 'collision-os-session',
};

module.exports = { sessionConfig };
