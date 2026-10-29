const { verifySessionToken } = require('../utils/session');
const { SOCKET_EVENTS } = require('../config/constants');
const logger = require('../utils/logger');

function registerRoomHandlers(socket, roomManager, io) {
  // Join Room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomCode = 'KCO1', sessionToken, preferredTeam }) => {
    let sessionData = null;
    if (sessionToken) {
      sessionData = verifySessionToken(sessionToken);
    }

    // Leave any previous rooms this socket was in
    for (const r of roomManager.rooms.values()) {
      if (r.roomCode !== roomCode && r.players.has(socket.id)) {
        r.removePlayer(socket.id);
        socket.leave(r.roomCode);
      }
    }

    const room = roomManager.getOrCreateRoom(roomCode);
    const player = room.addPlayer(socket, {
      sessionToken,
      fullName: sessionData?.fullName,
      studentId: sessionData?.studentId,
      faculty: sessionData?.faculty,
      phone: sessionData?.phone,
      preferredTeam
    });

    socket.emit('joinedSuccess', {
      roomCode: room.roomCode,
      player
    });
  });

  // Join as Spectator (Live TV / Audience screen)
  socket.on('joinSpectator', ({ roomCode }) => {
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit('spectatorError', { message: 'Phòng không tồn tại hoặc đã đóng!' });
      return;
    }
    socket.join(room.roomCode);

    // Snapshot full state to spectator
    const playersList = Array.from(room.players.values());
    const teamA = playersList.filter(p => p.team === 'A');
    const teamB = playersList.filter(p => p.team === 'B');

    socket.emit('spectatorJoinedSuccess', {
      roomCode: room.roomCode,
      mode: room.mode,
      maxPerTeam: room.maxPerTeam,
      state: room.state,
      scoreA: room.scoreA,
      scoreB: room.scoreB,
      ropeOffset: room.ropeOffset,
      roundNumber: room.roundCount,
      teamA,
      teamB,
      tacticalCards: room.tacticalCards,
      currentQuestion: room.currentQuestion ? {
        roundNumber: room.roundCount,
        category: room.currentQuestion.category,
        question: room.currentQuestion.question,
        options: room.currentQuestion.options,
        totalQuestions: room.questions.length
      } : null,
      buzzerWinner: room.buzzerWinner,
      reboundData: room.reboundData,
      deadline: room.currentDeadline,
      activeCardEffects: room.activeCardEffects,
      frozenSecondsLeft: room.frozenSecondsLeft || 0
    });
    logger.info('Spectator', `Spectator ${socket.id} joined room [${roomCode}]`);
  });

  socket.on('leaveSpectator', ({ roomCode }) => {
    if (roomCode) {
      socket.leave(roomCode);
      logger.info('Spectator', `Spectator ${socket.id} left room [${roomCode}]`);
    }
  });

  // Switch Team in Lobby
  socket.on(SOCKET_EVENTS.SWITCH_TEAM, ({ team }) => {
    for (const room of roomManager.rooms.values()) {
      if (room.players.has(socket.id)) {
        room.switchTeam(socket.id, team);
        break;
      }
    }
  });

  // Toggle Ready State
  socket.on(SOCKET_EVENTS.SET_READY, ({ isReady }) => {
    for (const room of roomManager.rooms.values()) {
      if (room.players.has(socket.id)) {
        room.setReady(socket.id, isReady);
        break;
      }
    }
  });

  // Resume Session after disconnect
  socket.on(SOCKET_EVENTS.RESUME_SESSION, ({ sessionToken, roomCode = 'KCO1' }) => {
    if (!sessionToken) return;
    const sessionData = verifySessionToken(sessionToken);
    if (!sessionData) return;

    // Check all rooms for either disconnected or existing player record
    for (const room of roomManager.rooms.values()) {
      let isFound = room.disconnectedPlayers.has(sessionToken);
      if (!isFound) {
        for (const p of room.players.values()) {
          if (p.sessionToken === sessionToken || (sessionData.studentId && p.studentId === sessionData.studentId)) {
            isFound = true;
            break;
          }
        }
      }

      if (isFound) {
        const player = room.addPlayer(socket, {
          sessionToken,
          fullName: sessionData.fullName,
          studentId: sessionData.studentId,
          faculty: sessionData.faculty,
          phone: sessionData.phone
        });
        socket.emit('joinedSuccess', {
          roomCode: room.roomCode,
          player
        });
        socket.emit('sessionResumed', {
          roomCode: room.roomCode,
          state: room.state
        });
        return;
      }
    }

    // Fallback: If not found in any room, join roomCode automatically
    const room = roomManager.getOrCreateRoom(roomCode);
    const player = room.addPlayer(socket, {
      sessionToken,
      fullName: sessionData.fullName,
      studentId: sessionData.studentId,
      faculty: sessionData.faculty,
      phone: sessionData.phone
    });
    socket.emit('joinedSuccess', {
      roomCode: room.roomCode,
      player
    });
  });

  // Add Practice Bot into room
  socket.on(SOCKET_EVENTS.ADD_BOT, ({ roomCode = 'KCO1', targetTeam }) => {
    const room = roomManager.getOrCreateRoom(roomCode);
    room.addBot(targetTeam);
  });

  // Leave Room explicitly
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (room && room.players.has(socket.id)) {
      room.removePlayer(socket.id);
      socket.leave(roomCode);
    }
  });
}

module.exports = registerRoomHandlers;
