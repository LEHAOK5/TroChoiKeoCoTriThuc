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

  // List all active rooms for public spectator navigation
  router.get('/', (req, res) => {
    const rooms = roomManager ? roomManager.listRooms() : [];
    res.json({
      success: true,
      count: rooms.length,
      rooms
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

  // Get full room info for spectator and client sync
  router.get('/:code', (req, res) => {
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
      return res.status(404).json({
        error: { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' }
      });
    }

    const teamAPlayers = room.getTeamPlayers('A').map(p => ({
      name: p.name,
      studentId: p.studentId,
      faculty: p.faculty,
      isReady: p.isReady,
      isBot: Boolean(p.isBot)
    }));
    const teamBPlayers = room.getTeamPlayers('B').map(p => ({
      name: p.name,
      studentId: p.studentId,
      faculty: p.faculty,
      isReady: p.isReady,
      isBot: Boolean(p.isBot)
    }));

    res.json({
      success: true,
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state,
      playersCount: room.players.size,
      teamACount: teamAPlayers.length,
      teamBCount: teamBPlayers.length,
      teamAPlayers,
      teamBPlayers,
      scoreA: room.scoreA,
      scoreB: room.scoreB,
      ropeOffset: room.ropeOffset,
      roundNumber: room.roundCount,
      buzzerWinner: room.buzzerWinner,
      reboundData: room.reboundData,
      deadline: room.currentDeadline,
      currentQuestion: room.currentQuestion ? {
        roundNumber: room.roundCount,
        category: room.currentQuestion.category,
        question: room.currentQuestion.question,
        options: room.currentQuestion.options,
        totalQuestions: room.questions.length
      } : null,
      tacticalCards: room.tacticalCards,
      activeCardEffects: room.activeCardEffects
    });
  });

  return router;
}

module.exports = createRoomsRouter;
