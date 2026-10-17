const express = require('express');

function createRoomsRouter(roomManager) {
  const router = express.Router();

  // Create room
  router.post('/', (req, res) => {
    const { roomCode, mode = '1vs1' } = req.body || {};
    const room = roomManager.getOrCreateRoom(roomCode, mode);
    res.json({
      success: true,
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state
    });
  });

  // Quick match into an open room
  router.post('/quick-match', (req, res) => {
    const room = roomManager.quickMatch();
    res.json({
      success: true,
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state
    });
  });

  // Check room availability for registration
  router.get('/check/:code', (req, res) => {
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
      return res.status(404).json({
        exists: false,
        message: 'Mã phòng không tồn tại hoặc đã bị đóng bởi BTC'
      });
    }

    const countA = room.getTeamPlayers('A').length;
    const countB = room.getTeamPlayers('B').length;
    const isFull = room.players.size >= (room.maxPerTeam * 2);

    res.json({
      exists: true,
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state,
      playersCount: room.players.size,
      teamACount: countA,
      teamBCount: countB,
      canJoinA: countA < room.maxPerTeam,
      canJoinB: countB < room.maxPerTeam,
      isFull
    });
  });

  // Get room info
  router.get('/:code', (req, res) => {
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
      return res.status(404).json({
        error: { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' }
      });
    }

    res.json({
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state,
      playersCount: room.players.size,
      teamACount: room.getTeamPlayers('A').length,
      teamBCount: room.getTeamPlayers('B').length,
      scoreA: room.scoreA,
      scoreB: room.scoreB
    });
  });

  return router;
}

module.exports = createRoomsRouter;
