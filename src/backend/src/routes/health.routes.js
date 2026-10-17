const express = require('express');

function createHealthRouter(roomManager) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      app: 'KÉO CO TRI THỨC API v2.0',
      uptime: process.uptime(),
      roomsCount: roomManager ? roomManager.rooms.size : 0,
      playersCount: roomManager ? roomManager.getTotalPlayersCount() : 0,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createHealthRouter;
