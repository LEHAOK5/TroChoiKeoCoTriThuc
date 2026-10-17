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
