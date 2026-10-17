const { Server } = require('socket.io');
const { corsOptions } = require('../config/cors');
const { SOCKET_EVENTS } = require('../config/constants');
const registerRoomHandlers = require('./roomHandlers');
const registerGameHandlers = require('./gameHandlers');
const RoomManager = require('../game/RoomManager');
const logger = require('../utils/logger');

function initSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 10000
  });

  const roomManager = new RoomManager(io);

  io.on('connection', (socket) => {
    logger.info('SocketIO', `Client connected: ${socket.id}`);

    // Register handlers
    registerRoomHandlers(socket, roomManager, io);
    registerGameHandlers(socket, roomManager, io);

    // RTT measurement ping every 5 seconds
    const pingTimer = setInterval(() => {
      if (socket.connected) {
        socket.lastPingTs = Date.now();
        socket.emit(SOCKET_EVENTS.PING, { id: socket.id, ts: socket.lastPingTs });
      }
    }, 5000);

    socket.on('disconnect', () => {
      clearInterval(pingTimer);
      logger.info('SocketIO', `Client disconnected: ${socket.id}`);
      for (const room of roomManager.rooms.values()) {
        if (room.players.has(socket.id)) {
          room.removePlayer(socket.id);
          break;
        }
      }
    });
  });

  return { io, roomManager };
}

module.exports = initSocketIO;
