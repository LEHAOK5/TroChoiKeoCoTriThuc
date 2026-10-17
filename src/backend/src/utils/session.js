const jwt = require('jsonwebtoken');
const config = require('../config/env');

function createSessionToken(payload) {
  return jwt.sign(payload, config.SESSION_SECRET, { expiresIn: '24h' });
}

function verifySessionToken(token) {
  try {
    return jwt.verify(token, config.SESSION_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  createSessionToken,
  verifySessionToken
};
