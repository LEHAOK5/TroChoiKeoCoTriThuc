const GameRoom = require('./GameRoom');
const { generateRoomCode } = require('../utils/matchCode');
const config = require('../config/env');
const { ROOM_STATES } = require('../config/constants');
const logger = require('../utils/logger');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> GameRoom
    // Global used question IDs across matches to prevent repetition
    this.globalUsedQuestionIds = new Set();
    // Create initial room KCO1 in 1vs1 mode
    this.getOrCreateRoom('KCO1', '1vs1');
  }

  getGlobalUsedQuestionIds() {
    return Array.from(this.globalUsedQuestionIds);
  }

  recordUsedQuestionIds(ids) {
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      this.globalUsedQuestionIds.add(id);
    }
    logger.info('RoomManager', `Recorded ${ids.length} used questions. Total unique used questions: ${this.globalUsedQuestionIds.size}/600`);
    // If pool is nearing exhaustion (> 550 used out of 600), retain only the most recent 35
    if (this.globalUsedQuestionIds.size >= 550) {
      logger.info('RoomManager', `Recycling globalUsedQuestionIds (reached ${this.globalUsedQuestionIds.size}/600). Retaining most recent 35.`);
      const recent = ids.slice(-35);
      this.globalUsedQuestionIds = new Set(recent);
    }
  }

  clearGlobalUsedQuestionIds() {
    this.globalUsedQuestionIds.clear();
    logger.info('RoomManager', 'Cleared globalUsedQuestionIds.');
  }

  createRoom({ mode = '1vs1', customCode = null } = {}) {
    let code = customCode ? customCode.toUpperCase().trim() : '';
    if (!code) {
      // Generate a 4-digit numeric code like '8291'
      do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
      } while (this.rooms.has(code));
    }

    const maxPerTeam = parseInt(mode[0], 10) || 1;
    const room = new GameRoom(code, this.io, { mode, maxPerTeam, roomManager: this });
    this.rooms.set(code, room);
    logger.info('RoomManager', `Created managed room: ${code} (${mode}, ${maxPerTeam} vs ${maxPerTeam})`);
    return room;
  }

  getOrCreateRoom(roomCode, mode = '1vs1') {
    const code = (roomCode || generateRoomCode()).toUpperCase().trim();
    if (!this.rooms.has(code)) {
      const maxPerTeam = parseInt(mode[0], 10) || 1;
      const room = new GameRoom(code, this.io, { mode, maxPerTeam, roomManager: this });
      this.rooms.set(code, room);
      logger.info('RoomManager', `Created room: ${code} (${mode})`);
    }
    return this.rooms.get(code);
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim()) || null;
  }

  quickMatch() {
    // Find room in LOBBY state that has open slots
    for (const [code, room] of this.rooms.entries()) {
      if (room.state === ROOM_STATES.LOBBY && room.players.size < (room.maxPerTeam * 2)) {
        return room;
      }
    }
    // No open room, generate new room
    return this.createRoom({ mode: '1vs1' });
  }

  closeRoom(roomCode) {
    const code = roomCode.toUpperCase().trim();
    if (this.rooms.has(code)) {
      const room = this.rooms.get(code);
      room.clearRoundTimers();
      this.rooms.delete(code);
      logger.info('RoomManager', `Closed room: ${code}`);
      return true;
    }
    return false;
  }

  listRooms() {
    const list = [];
    for (const [code, room] of this.rooms.entries()) {
      list.push({
        roomCode: code,
        mode: room.mode || '1vs1',
        maxPerTeam: room.maxPerTeam || 1,
        state: room.state,
        playersCount: room.players.size,
        teamACount: room.getTeamPlayers('A').length,
        teamBCount: room.getTeamPlayers('B').length,
        teamAPlayers: room.getTeamPlayers('A').map(p => ({
          name: p.name,
          studentId: p.studentId,
          isReady: p.isReady,
          isBot: Boolean(p.isBot)
        })),
        teamBPlayers: room.getTeamPlayers('B').map(p => ({
          name: p.name,
          studentId: p.studentId,
          isReady: p.isReady,
          isBot: Boolean(p.isBot)
        })),
        scoreA: room.scoreA,
        scoreB: room.scoreB,
        ropeOffset: room.ropeOffset,
        roundCount: room.roundCount,
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
        startedAt: room.startedAt
      });
    }
    return list;
  }

  getTotalPlayersCount() {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.size;
    }
    return count;
  }
}

module.exports = RoomManager;
