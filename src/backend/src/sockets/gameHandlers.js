const { SOCKET_EVENTS } = require('../config/constants');
const logger = require('../utils/logger');

function registerGameHandlers(socket, roomManager, io) {
  // Helper to find player's room
  const findRoom = (roomCode) => {
    if (roomCode) {
      const r = roomManager.getRoom(roomCode);
      if (r) return r;
    }
    for (const r of roomManager.rooms.values()) {
      if (r.players.has(socket.id)) return r;
    }
    return null;
  };

  // Buzzer Press
  socket.on(SOCKET_EVENTS.PRESS_BUZZER, ({ roomCode } = {}) => {
    const room = findRoom(roomCode);
    if (!room) {
      logger.info('GameHandlers', `Buzzer pressed but no active room found for socket ${socket.id}`);
      return;
    }
    room.handleBuzzerPress(socket.id);
  });

  // Submit Answer
  socket.on(SOCKET_EVENTS.SUBMIT_ANSWER, ({ roomCode, answerIndex } = {}) => {
    const room = findRoom(roomCode);
    if (!room) return;
    room.submitAnswer(socket.id, answerIndex);
  });

  // Use Tactical Card
  socket.on(SOCKET_EVENTS.USE_TACTICAL_CARD, ({ roomCode, cardType } = {}) => {
    const room = findRoom(roomCode);
    if (!room) return;
    room.handleUseTacticalCard(socket.id, cardType);
  });

  // Request Rematch
  socket.on(SOCKET_EVENTS.REQUEST_REMATCH, ({ roomCode } = {}) => {
    const room = findRoom(roomCode);
    if (!room) return;
    room.resetRoom();
  });

  // Pong from client for RTT measurement
  socket.on(SOCKET_EVENTS.PONG, ({ id, clientSendTs }) => {
    if (socket.lastPingTs) {
      const rtt = Date.now() - socket.lastPingTs;
      // Update RTT in player's room
      for (const room of roomManager.rooms.values()) {
        if (room.players.has(socket.id)) {
          room.buzzerEngine.updateRTT(socket.id, rtt);
          break;
        }
      }
    }
  });
}

module.exports = registerGameHandlers;
