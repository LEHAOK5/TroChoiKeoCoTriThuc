const config = require('../config/env');
const { ROOM_STATES, TEAMS, TEAM_NAMES, END_REASONS, SOCKET_EVENTS, TACTICAL_CARDS } = require('../config/constants');
const BuzzerEngine = require('./BuzzerEngine');
const ReboundLaw = require('./ReboundLaw');
const RopeCalculator = require('./RopeCalculator');
const { getRandomQuestions } = require('../repositories/question.repository');
const { saveMatch } = require('../repositories/match.repository');
const { recordParticipantJoin, updateParticipantsResult } = require('../repositories/participant.repository');
const { generateMatchCode } = require('../utils/matchCode');
const logger = require('../utils/logger');

class GameRoom {
  constructor(roomCode, io, options = {}) {
    this.roomCode = roomCode;
    this.io = io;
    this.roomManager = options.roomManager || null;
    this.mode = options.mode || '1vs1';
    this.maxPerTeam = options.maxPerTeam || parseInt(this.mode[0], 10) || 1;
    this.createdAt = new Date();
    this.state = ROOM_STATES.LOBBY;
    
    // Players: socketId -> Player
    this.players = new Map();
    // Disconnected players: sessionToken -> { player, disconnectTimer }
    this.disconnectedPlayers = new Map();

    this.scoreA = 0;
    this.scoreB = 0;
    this.ropeOffset = 0;
    this.roundCount = 0;

    this.questions = [];
    this.currentQuestionIndex = -1;
    this.currentQuestion = null;
    this.usedQuestionIds = [];

    this.buzzerEngine = new BuzzerEngine();
    this.reboundLaw = new ReboundLaw(config.REBOUND_TIMEOUT_SEC);
    this.ropeCalculator = new RopeCalculator(config.WIN_SCORE);

    this.buzzerWinner = null;
    this.reboundData = null;

    this.questionTimer = null;
    this.answerTimer = null;
    this.reboundTimer = null;
    this.matchDurationTimer = null;

    this.startedAt = null;
    this.finishedAt = null;
    this.currentDeadline = null;

    // Tactical Cards state
    this.tacticalCards = {
      A: { FIREWALL: false, DDOS: false, DOUBLE_PULL: false, FIFTY_FIFTY: false },
      B: { FIREWALL: false, DDOS: false, DOUBLE_PULL: false, FIFTY_FIFTY: false }
    };
    this.roundActiveCard = { A: null, B: null };
    this.frozenUntil = { A: 0, B: 0 };
  }

  // --- PLAYER MANAGEMENT ---
  addPlayer(socket, { sessionToken, fullName, studentId, faculty = '', phone = '', preferredTeam = null }) {
    // If room was finished or empty, reset to LOBBY
    if (this.state === ROOM_STATES.FINISHED || this.players.size === 0) {
      this.resetRoom();
    }

    // Check if player has an existing session recovering
    let existingData = null;
    if (this.disconnectedPlayers.has(sessionToken)) {
      const recovered = this.disconnectedPlayers.get(sessionToken);
      clearTimeout(recovered.disconnectTimer);
      this.disconnectedPlayers.delete(sessionToken);
      existingData = recovered.player;
      logger.info('GameRoom', `Player reconnected to room ${this.roomCode}: ${existingData.name}`);
    } else {
      // Check if player is currently in this.players with an old socket ID (same session token only)
      for (const [oldId, p] of this.players.entries()) {
        if (sessionToken && p.sessionToken === sessionToken && oldId !== socket.id) {
          this.players.delete(oldId);
          existingData = p;
          logger.info('GameRoom', `Migrated player ${p.name} from socket ${oldId} -> ${socket.id}`);
          break;
        }
      }
    }

    // Check for duplicate studentId in the same room
    if (studentId) {
      for (const [existingSocketId, p] of this.players.entries()) {
        if (p.studentId === studentId && p.sessionToken !== sessionToken && existingSocketId !== socket.id) {
          socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
            code: 'DUPLICATE_MSSV',
            message: `MSSV ${studentId} đã có người đang tham gia trong phòng #${this.roomCode}!`
          });
          return null;
        }
      }
    }

    // Determine team: Prioritize preferredTeam if specified and has slot
    const countA = this.getTeamPlayers(TEAMS.A).length;
    const countB = this.getTeamPlayers(TEAMS.B).length;

    let team = null;
    if (preferredTeam === TEAMS.A && (countA < this.maxPerTeam || (existingData && existingData.team === TEAMS.A))) {
      team = TEAMS.A;
    } else if (preferredTeam === TEAMS.B && (countB < this.maxPerTeam || (existingData && existingData.team === TEAMS.B))) {
      team = TEAMS.B;
    } else if (existingData && (existingData.team === TEAMS.A || existingData.team === TEAMS.B)) {
      team = existingData.team;
    } else {
      if (countA < this.maxPerTeam && (countA <= countB || countB >= this.maxPerTeam)) {
        team = TEAMS.A;
      } else {
        team = TEAMS.B;
      }
    }

    const player = {
      socketId: socket.id,
      sessionToken: sessionToken || existingData?.sessionToken,
      name: existingData ? existingData.name : (fullName || `Người chơi ${socket.id.slice(0, 4)}`),
      studentId: existingData ? existingData.studentId : (studentId || 'SV000'),
      faculty: existingData ? existingData.faculty : faculty,
      phone: existingData ? existingData.phone : phone,
      team,
      isReady: existingData ? existingData.isReady : false,
      status: 'online'
    };

    socket.join(this.roomCode);
    this.players.set(socket.id, player);

    logger.info('GameRoom', `Player joined [${this.roomCode}]: ${player.name} (${player.studentId}) -> Team ${team}`);
    this.broadcastRoomState();

    if (player.studentId && !player.isBot) {
      recordParticipantJoin({
        matchCode: this.currentMatchCode || `ROOM-${this.roomCode}`,
        roomCode: this.roomCode,
        studentId: player.studentId,
        studentName: player.name,
        faculty: player.faculty,
        team
      }).catch(err => logger.error('GameRoom', `recordParticipantJoin error: ${err.message}`));

      this.io.emit('adminParticipantJoined', {
        studentId: player.studentId,
        studentName: player.name,
        faculty: player.faculty,
        team,
        roomCode: this.roomCode,
        joinedAt: new Date()
      });
    }

    // If match is active, sync question & state immediately to reconnecting client
    if (this.state === ROOM_STATES.ROUND_BUZZ || this.state === ROOM_STATES.ROUND_ANSWER || this.state === ROOM_STATES.ROUND_REBOUND) {
      if (this.currentQuestion) {
        socket.emit(SOCKET_EVENTS.NEW_QUESTION, {
          question: {
            roundNumber: this.roundCount,
            category: this.currentQuestion.category,
            question: this.currentQuestion.question,
            options: this.currentQuestion.options,
            totalQuestions: this.questions.length
          },
          state: this.state,
          scoreA: this.scoreA,
          scoreB: this.scoreB,
          ropeOffset: this.ropeOffset,
          deadline: this.currentDeadline
        });

        if (this.state === ROOM_STATES.ROUND_ANSWER && this.buzzerWinner) {
          socket.emit(SOCKET_EVENTS.BUZZER_AWARDED, {
            team: this.buzzerWinner.team,
            playerName: this.buzzerWinner.playerName,
            timeLimit: config.ANSWER_TIMEOUT_SEC,
            deadline: this.currentDeadline
          });
        } else if (this.state === ROOM_STATES.ROUND_REBOUND && this.reboundData) {
          socket.emit(SOCKET_EVENTS.REBOUND_OPEN, this.reboundData);
        }
      }
    }

    return player;
  }

  // Add Practice Bot into room
  addBot(targetTeam = null) {
    if (this.state !== ROOM_STATES.LOBBY) return;
    const teamA = this.getTeamPlayers(TEAMS.A);
    const teamB = this.getTeamPlayers(TEAMS.B);
    const team = targetTeam || (teamA.length <= teamB.length ? TEAMS.A : TEAMS.B);
    const botId = `bot_${Date.now()}`;
    const botPlayer = {
      socketId: botId,
      sessionToken: `bot_token_${botId}`,
      name: 'Bot Tri Thức 🤖',
      studentId: 'AI-2026',
      faculty: 'CNTT',
      phone: '0900000000',
      team,
      isReady: true,
      isBot: true,
      status: 'online'
    };
    this.players.set(botId, botPlayer);
    logger.info('GameRoom', `Added bot ${botPlayer.name} to Team ${team} in [${this.roomCode}]`);
    this.broadcastRoomState();
    this.checkAutoStart();
    return botPlayer;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;

    this.buzzerEngine.removePlayer(socketId);
    this.players.delete(socketId);

    // If room is in COUNTDOWN when a player leaves, abort countdown back to LOBBY
    if (this.state === ROOM_STATES.COUNTDOWN) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      this.state = ROOM_STATES.LOBBY;
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.START_COUNTDOWN, { seconds: 0 });
      logger.info('GameRoom', `Countdown aborted in [${this.roomCode}] because player ${player.name} left.`);
    }

    // If game is in progress, preserve player for RECONNECT_GRACE_SEC
    if (this.state !== ROOM_STATES.LOBBY && this.state !== ROOM_STATES.FINISHED && this.state !== ROOM_STATES.COUNTDOWN) {
      const disconnectTimer = setTimeout(() => {
        this.disconnectedPlayers.delete(player.sessionToken);
        this.checkForfeit();
      }, config.RECONNECT_GRACE_SEC * 1000);

      this.disconnectedPlayers.set(player.sessionToken, {
        player,
        disconnectTimer
      });

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.PLAYER_STATUS, {
        playerId: player.socketId,
        status: 'reconnecting'
      });
    }

    logger.info('GameRoom', `Player disconnected from [${this.roomCode}]: ${player.name}`);
    this.broadcastRoomState();
  }

  switchTeam(socketId, newTeam) {
    if (this.state !== ROOM_STATES.LOBBY) return;
    if (newTeam !== TEAMS.A && newTeam !== TEAMS.B) return;

    const player = this.players.get(socketId);
    if (!player) return;

    // Check team size limit
    const targetCount = this.getTeamPlayers(newTeam).length;
    if (targetCount >= this.maxPerTeam) {
      this.io.to(socketId).emit(SOCKET_EVENTS.ERROR_MESSAGE, {
        code: 'TEAM_FULL',
        message: `Đội ${newTeam === 'A' ? 'A' : 'B'} đã đủ tối đa ${this.maxPerTeam} người (${this.mode})!`
      });
      return;
    }

    player.team = newTeam;
    player.isReady = false;
    this.broadcastRoomState();
  }

  setReady(socketId, isReady) {
    const player = this.players.get(socketId);
    if (!player) return;

    // If room was finished, automatically transition to LOBBY
    if (this.state === ROOM_STATES.FINISHED) {
      this.state = ROOM_STATES.LOBBY;
      this.scoreA = 0;
      this.scoreB = 0;
      this.ropeOffset = 0;
      this.roundCount = 0;
      this.usedQuestionIds = [];
    }

    if (this.state !== ROOM_STATES.LOBBY) return;

    player.isReady = Boolean(isReady);
    this.broadcastRoomState();

    this.checkAutoStart();
  }

  getTeamPlayers(team) {
    return Array.from(this.players.values()).filter(p => p.team === team);
  }

  checkAutoStart() {
    if (this.state !== ROOM_STATES.LOBBY) return;
    const teamA = this.getTeamPlayers(TEAMS.A);
    const teamB = this.getTeamPlayers(TEAMS.B);

    // Require both teams to reach maxPerTeam and all members ready
    const readyA = teamA.length >= this.maxPerTeam && teamA.every(p => p.isReady);
    const readyB = teamB.length >= this.maxPerTeam && teamB.every(p => p.isReady);

    if (readyA && readyB) {
      this.startCountdown();
    }
  }

  startCountdown() {
    this.state = ROOM_STATES.COUNTDOWN;
    let count = 3;
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.START_COUNTDOWN, { seconds: count });

    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(async () => {
      count--;
      if (count > 0) {
        this.io.to(this.roomCode).emit(SOCKET_EVENTS.START_COUNTDOWN, { seconds: count });
      } else {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        await this.startMatch();
      }
    }, 1000);
  }

  async startMatch() {
    this.state = ROOM_STATES.ROUND_BUZZ;
    this.scoreA = 0;
    this.scoreB = 0;
    this.ropeOffset = 0;
    this.roundCount = 0;
    this.startedAt = new Date();
    this.currentMatchCode = generateMatchCode();

    // Đồng bộ mã trận cho toàn bộ sinh viên đang có mặt trong phòng
    for (const player of this.players.values()) {
      if (player.studentId && !player.isBot) {
        recordParticipantJoin({
          matchCode: this.currentMatchCode,
          roomCode: this.roomCode,
          studentId: player.studentId,
          studentName: player.name,
          faculty: player.faculty,
          team: player.team
        }).catch(err => logger.error('GameRoom', `recordParticipantJoin startMatch error: ${err.message}`));
      }
    }

    // Preload 35 balanced questions from DB, excluding questions already used across matches
    const excludeIds = this.roomManager 
      ? this.roomManager.getGlobalUsedQuestionIds() 
      : this.usedQuestionIds;

    this.questions = await getRandomQuestions(35, excludeIds);
    if (!this.questions || this.questions.length === 0) {
      logger.info('GameRoom', `Exhausted excludeIds (${excludeIds.length}), recycling all questions.`);
      if (this.roomManager) this.roomManager.clearGlobalUsedQuestionIds();
      this.usedQuestionIds = [];
      this.questions = await getRandomQuestions(35, []);
    }

    // Record selected question IDs into used lists so subsequent matches don't repeat them
    if (this.questions && this.questions.length > 0) {
      const selectedIds = this.questions.map(q => q.id);
      if (this.roomManager) {
        this.roomManager.recordUsedQuestionIds(selectedIds);
      }
      this.usedQuestionIds.push(...selectedIds);
    }
    this.currentQuestionIndex = -1;

    // Start 600-second match duration timer if configured
    if (config.MATCH_TIME_LIMIT_SEC > 0) {
      this.matchDurationTimer = setTimeout(() => {
        this.handleMatchTimeout();
      }, config.MATCH_TIME_LIMIT_SEC * 1000);
    }

    logger.info('GameRoom', `Match started in [${this.roomCode}] with ${this.questions.length} questions loaded.`);
    this.nextQuestion();
  }

  nextQuestion() {
    this.clearRoundTimers();
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      // Out of preloaded questions -> determine winner by score or finish
      this.finishMatch(
        this.scoreA > this.scoreB ? 'A' : (this.scoreB > this.scoreA ? 'B' : 'DRAW'),
        END_REASONS.SCORE
      );
      return;
    }

    const q = this.questions[this.currentQuestionIndex];
    this.currentQuestion = q;
    this.usedQuestionIds.push(q.id);
    this.buzzerWinner = null;
    this.reboundData = null;
    this.state = ROOM_STATES.ROUND_BUZZ;
    this.roundCount++;
    this.roundActiveCard = { A: null, B: null };
    this.frozenUntil = { A: 0, B: 0 };

    this.buzzerEngine.reset();

    const deadline = Date.now() + config.BUZZ_TIMEOUT_SEC * 1000;
    this.currentDeadline = deadline;

    const publicQuestion = {
      roundNumber: this.roundCount,
      category: q.category,
      question: q.question,
      options: q.options,
      totalQuestions: this.questions.length
    };

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.NEW_QUESTION, {
      question: publicQuestion,
      state: ROOM_STATES.ROUND_BUZZ,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      ropeOffset: this.ropeOffset,
      tacticalCards: this.tacticalCards,
      deadline
    });

    // 15s buzzer timeout
    this.questionTimer = setTimeout(() => {
      if (this.state === ROOM_STATES.ROUND_BUZZ) {
        this.io.to(this.roomCode).emit(SOCKET_EVENTS.BOTH_TEAMS_WRONG, {
          reason: 'BUZZER_TIMEOUT',
          title: 'HẾT GIỜ BẤM CHUÔNG!',
          message: 'Không có đội nào bấm chuông giành quyền trả lời!',
          correctIndex: q.answer_index,
          correctOption: q.options[q.answer_index],
          explanation: q.explanation,
          scoreA: this.scoreA,
          scoreB: this.scoreB,
          ropeOffset: this.ropeOffset
        });
        setTimeout(() => this.nextQuestion(), 3500);
      }
    }, config.BUZZ_TIMEOUT_SEC * 1000);

    // Schedule automated practice bot action if room has bot
    this.scheduleBotAction();
  }

  scheduleBotAction() {
    const bots = Array.from(this.players.values()).filter(p => p.isBot);
    if (bots.length === 0) return;
    const bot = bots[0];

    // In ROUND_BUZZ: Bot will buzz after 6-8 seconds if human doesn't buzz
    if (this.state === ROOM_STATES.ROUND_BUZZ) {
      const delayMs = 6000 + Math.random() * 2500;
      this.botBuzzTimer = setTimeout(() => {
        if (this.state === ROOM_STATES.ROUND_BUZZ) {
          logger.info('GameRoom', `Practice bot [${bot.name}] buzzing after ${Math.round(delayMs)}ms`);
          this.handleBuzzerPress(bot.socketId);
        }
      }, delayMs);
    }
  }

  handleBuzzerPress(socketId) {
    if (this.state !== ROOM_STATES.ROUND_BUZZ) {
      logger.info('GameRoom', `Buzzer rejected: room state is ${this.state}, expected ROUND_BUZZ`);
      return;
    }
    const player = this.players.get(socketId);
    if (!player) {
      logger.info('GameRoom', `Buzzer rejected: player not found for socket ${socketId}`);
      return;
    }

    // Check if team is frozen by DDoS attack
    if (this.frozenUntil[player.team] && Date.now() < this.frozenUntil[player.team]) {
      logger.info('GameRoom', `Buzzer rejected: Team ${player.team} is currently frozen by DDoS attack`);
      const timeLeft = Math.max(0.1, (this.frozenUntil[player.team] - Date.now()) / 1000).toFixed(1);
      const sock = this.io.sockets.sockets.get(socketId);
      if (sock) {
        sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
          code: 'TEAM_FROZEN',
          message: `Nút chuông đang bị đóng băng bởi DDoS! Còn ${timeLeft}s`
        });
      }
      return;
    }

    this.buzzerEngine.registerBuzz({
      socketId,
      team: player.team,
      playerName: player.name
    }, (winningBuzz) => {
      this.awardBuzzer(winningBuzz);
    });
  }

  awardBuzzer(winningBuzz) {
    clearTimeout(this.questionTimer);
    this.state = ROOM_STATES.ROUND_ANSWER;
    this.buzzerWinner = winningBuzz;

    const deadline = Date.now() + config.ANSWER_TIMEOUT_SEC * 1000;
    this.currentDeadline = deadline;

    logger.info('GameRoom', `BUZZER AWARDED in [${this.roomCode}] to Team ${winningBuzz.team} (${winningBuzz.playerName})`);

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.BUZZER_AWARDED, {
      team: winningBuzz.team,
      playerName: winningBuzz.playerName,
      timeLimit: config.ANSWER_TIMEOUT_SEC,
      deadline
    });

    // If winning buzz was by a practice bot, auto-answer after 2.5s
    if (winningBuzz.socketId && winningBuzz.socketId.startsWith('bot_')) {
      this.botAnswerTimer = setTimeout(() => {
        if (this.state === ROOM_STATES.ROUND_ANSWER) {
          const isCorrect = Math.random() < 0.75;
          const answerIdx = isCorrect ? this.currentQuestion.answer_index : (this.currentQuestion.answer_index + 1) % 4;
          this.submitAnswer(winningBuzz.socketId, answerIdx);
        }
      }, 2500);
    }

    // 10s answer timer
    this.answerTimer = setTimeout(() => {
      if (this.state === ROOM_STATES.ROUND_ANSWER) {
        this.handleAnswerTimeout();
      }
    }, config.ANSWER_TIMEOUT_SEC * 1000);
  }

  submitAnswer(socketId, answerIndex) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (this.state === ROOM_STATES.ROUND_ANSWER) {
      if (!this.buzzerWinner || this.buzzerWinner.team !== player.team) return;
      clearTimeout(this.answerTimer);
      this.evaluateAnswer(player.team, player.name, answerIndex, false);
    } else if (this.state === ROOM_STATES.ROUND_REBOUND) {
      if (!this.reboundData || this.reboundData.reboundTeam !== player.team) return;
      clearTimeout(this.reboundTimer);
      this.evaluateAnswer(player.team, player.name, answerIndex, true);
    }
  }

  evaluateAnswer(team, playerName, answerIndex, isRebound = false) {
    const q = this.currentQuestion;
    const isCorrect = Number(answerIndex) === Number(q.answer_index);

    if (isCorrect) {
      const isDoublePull = this.roundActiveCard[team] === 'DOUBLE_PULL';
      const result = this.ropeCalculator.applyScore(team, this.scoreA, this.scoreB, this.ropeOffset, isDoublePull);
      this.scoreA = result.scoreA;
      this.scoreB = result.scoreB;
      this.ropeOffset = result.ropeOffset;

      logger.info('GameRoom', `[${this.roomCode}] Team ${team} answered CORRECT! isDoublePull=${isDoublePull} Score: A=${this.scoreA} | B=${this.scoreB}`);

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.ANSWER_RESULT, {
        isCorrect: true,
        answeringTeam: team,
        playerName,
        isRebound,
        isDoublePull,
        correctIndex: q.answer_index,
        correctOption: q.options[q.answer_index],
        explanation: q.explanation,
        scoreA: this.scoreA,
        scoreB: this.scoreB,
        ropeOffset: this.ropeOffset
      });

      if (result.winner) {
        setTimeout(() => this.finishMatch(result.winner, END_REASONS.SCORE), 2500);
      } else {
        setTimeout(() => this.nextQuestion(), 3500);
      }
    } else {
      // Incorrect answer
      logger.info('GameRoom', `[${this.roomCode}] Team ${team} answered INCORRECT!`);

      // Check Double Pull Penalty (lùi dây 1 nấc về phía đối phương)
      if (this.roundActiveCard[team] === 'DOUBLE_PULL') {
        const penResult = this.ropeCalculator.applyPenalty(team, this.scoreA, this.scoreB, this.ropeOffset, 1);
        this.ropeOffset = penResult.ropeOffset;
        logger.info('GameRoom', `[${this.roomCode}] DOUBLE_PULL failed! Penalized Team ${team} -1 rope step.`);
      }

      if (!isRebound) {
        // Check Firewall: Chống cướp điểm Rebound
        if (this.roundActiveCard[team] === 'FIREWALL') {
          logger.info('GameRoom', `[${this.roomCode}] Team ${team} FIREWALL active! Blocked opponent rebound.`);
          this.io.to(this.roomCode).emit(SOCKET_EVENTS.ANSWER_RESULT, {
            isCorrect: false,
            answeringTeam: team,
            playerName,
            isRebound: false,
            blockedByFirewall: true,
            isDoublePull: this.roundActiveCard[team] === 'DOUBLE_PULL',
            correctIndex: q.answer_index,
            correctOption: q.options[q.answer_index],
            explanation: q.explanation,
            scoreA: this.scoreA,
            scoreB: this.scoreB,
            ropeOffset: this.ropeOffset
          });
          setTimeout(() => this.nextQuestion(), 3500);
          return;
        }

        // Open Rebound Opportunity for opponent (8s) with eliminatedIndex
        const rebound = this.reboundLaw.createReboundOpportunity({
          failedTeam: team,
          eliminatedIndex: answerIndex
        });
        this.reboundData = rebound;
        this.state = ROOM_STATES.ROUND_REBOUND;
        this.currentDeadline = rebound.deadline;

        this.io.to(this.roomCode).emit(SOCKET_EVENTS.REBOUND_OPEN, rebound);

        // If opposing team has a bot, schedule bot rebound after 3.5s
        const reboundBot = Array.from(this.players.values()).find(
          p => p.isBot && p.team === rebound.reboundTeam
        );
        if (reboundBot) {
          this.botReboundTimer = setTimeout(() => {
            if (this.state === ROOM_STATES.ROUND_REBOUND) {
              this.submitAnswer(reboundBot.socketId, q.answer_index);
            }
          }, 3500);
        }

        this.reboundTimer = setTimeout(() => {
          if (this.state === ROOM_STATES.ROUND_REBOUND) {
            this.handleReboundTimeout();
          }
        }, config.REBOUND_TIMEOUT_SEC * 1000);
      } else {
        // Both teams failed (Both answered incorrectly)
        this.io.to(this.roomCode).emit(SOCKET_EVENTS.BOTH_TEAMS_WRONG, {
          reason: 'BOTH_INCORRECT',
          title: 'CẢ 2 ĐỘI ĐỀU TRẢ LỜI SAI!',
          message: 'Cả hai đội đều không đưa ra câu trả lời chính xác. Không đội nào được điểm!',
          correctIndex: q.answer_index,
          correctOption: q.options[q.answer_index],
          explanation: q.explanation,
          scoreA: this.scoreA,
          scoreB: this.scoreB,
          ropeOffset: this.ropeOffset
        });
        setTimeout(() => this.nextQuestion(), 3500);
      }
    }
  }

  handleAnswerTimeout() {
    const failedTeam = this.buzzerWinner ? this.buzzerWinner.team : 'A';
    const rebound = this.reboundLaw.createReboundOpportunity({
      failedTeam,
      eliminatedIndex: null
    });
    this.reboundData = rebound;
    this.state = ROOM_STATES.ROUND_REBOUND;
    this.currentDeadline = rebound.deadline;

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.REBOUND_OPEN, rebound);

    this.reboundTimer = setTimeout(() => {
      if (this.state === ROOM_STATES.ROUND_REBOUND) {
        this.handleReboundTimeout();
      }
    }, config.REBOUND_TIMEOUT_SEC * 1000);
  }

  handleReboundTimeout() {
    const q = this.currentQuestion;
    this.io.to(this.roomCode).emit(SOCKET_EVENTS.BOTH_TEAMS_WRONG, {
      reason: 'REBOUND_TIMEOUT',
      title: 'HẾT GIỜ CƯỚP ĐIỂM!',
      message: 'Hết thời gian suy nghĩ cướp điểm. Vòng đấu kết thúc hòa!',
      correctIndex: q.answer_index,
      correctOption: q.options[q.answer_index],
      explanation: q.explanation,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      ropeOffset: this.ropeOffset
    });
    setTimeout(() => this.nextQuestion(), 3500);
  }

  handleMatchTimeout() {
    if (this.state === ROOM_STATES.FINISHED) return;
    let winner = 'DRAW';
    if (this.scoreA > this.scoreB) winner = 'A';
    else if (this.scoreB > this.scoreA) winner = 'B';
    
    this.finishMatch(winner, END_REASONS.TIMEOUT);
  }

  checkForfeit() {
    if (this.state === ROOM_STATES.LOBBY || this.state === ROOM_STATES.FINISHED) return;
    const teamA = this.getTeamPlayers(TEAMS.A);
    const teamB = this.getTeamPlayers(TEAMS.B);

    if (teamA.length === 0 && teamB.length > 0) {
      this.finishMatch('B', END_REASONS.FORFEIT);
    } else if (teamB.length === 0 && teamA.length > 0) {
      this.finishMatch('A', END_REASONS.FORFEIT);
    }
  }

  async finishMatch(winner, reason = END_REASONS.SCORE) {
    this.clearRoundTimers();
    if (this.matchDurationTimer) clearTimeout(this.matchDurationTimer);
    
    this.state = ROOM_STATES.FINISHED;
    this.finishedAt = new Date();
    const matchCode = this.currentMatchCode || generateMatchCode();
    this.currentMatchCode = matchCode;

    const teamAPlayers = this.getTeamPlayers(TEAMS.A).map(p => ({ name: p.name, studentId: p.studentId }));
    const teamBPlayers = this.getTeamPlayers(TEAMS.B).map(p => ({ name: p.name, studentId: p.studentId }));

    logger.info('GameRoom', `MATCH FINISHED [${this.roomCode}]: Winner Team ${winner} (${reason}). Final: ${this.scoreA}-${this.scoreB}`);

    // Persist to Supabase match_history
    await saveMatch({
      matchCode,
      roomCode: this.roomCode,
      teamAName: TEAM_NAMES.A,
      teamBName: TEAM_NAMES.B,
      teamAPlayers,
      teamBPlayers,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      winner,
      endReason: reason,
      totalQuestions: this.roundCount,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt
    });

    // Cập nhật kết quả thắng / thua cho từng thí sinh trong match_participants
    await updateParticipantsResult({
      matchCode,
      roomCode: this.roomCode,
      winner
    }).catch(err => logger.error('GameRoom', `updateParticipantsResult error: ${err.message}`));

    // Phát socket realtime về Admin Dashboard
    this.io.emit('adminMatchFinished', {
      matchCode,
      roomCode: this.roomCode,
      winner,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      teamAPlayers,
      teamBPlayers,
      finishedAt: this.finishedAt
    });

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.GAME_OVER, {
      winner,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      ropeOffset: this.ropeOffset,
      matchCode,
      totalRounds: this.roundCount,
      reason
    });
  }

  resetRoom() {
    this.clearRoundTimers();
    if (this.matchDurationTimer) clearTimeout(this.matchDurationTimer);

    this.state = ROOM_STATES.LOBBY;
    this.scoreA = 0;
    this.scoreB = 0;
    this.ropeOffset = 0;
    this.roundCount = 0;
    this.currentQuestionIndex = -1;
    this.currentQuestion = null;
    this.buzzerWinner = null;
    this.reboundData = null;
    this.tacticalCards = {
      A: { FIREWALL: false, DDOS: false, DOUBLE_PULL: false, FIFTY_FIFTY: false },
      B: { FIREWALL: false, DDOS: false, DOUBLE_PULL: false, FIFTY_FIFTY: false }
    };
    this.roundActiveCard = { A: null, B: null };
    this.frozenUntil = { A: 0, B: 0 };
    // Note: Do not clear this.usedQuestionIds here so rematches continue with fresh questions

    for (const player of this.players.values()) {
      player.isReady = false;
    }

    this.broadcastRoomState();
  }

  // Handle tactical card usage
  handleUseTacticalCard(socketId, cardType) {
    const player = this.players.get(socketId);
    if (!player) return;
    const team = player.team;
    const opponentTeam = team === 'A' ? 'B' : 'A';
    const sock = this.io.sockets.sockets.get(socketId);

    if (!Object.values(TACTICAL_CARDS).includes(cardType)) return;

    if (this.tacticalCards[team][cardType]) {
      if (sock) {
        sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
          code: 'CARD_ALREADY_USED',
          message: 'Thẻ bài này đã được sử dụng trong trận đấu!'
        });
      }
      return;
    }

    if (this.roundActiveCard[team]) {
      if (sock) {
        sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
          code: 'CARD_LIMIT_REACHED',
          message: 'Mỗi vòng chỉ được sử dụng tối đa 1 thẻ chiến thuật!'
        });
      }
      return;
    }

    if (cardType === TACTICAL_CARDS.DDOS) {
      if (this.state !== ROOM_STATES.ROUND_BUZZ || this.buzzerWinner) {
        if (sock) sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, { code: 'INVALID_TIMING', message: 'Thẻ DDoS chỉ được dùng trong 15s bấm chuông khi chưa có ai giành quyền!' });
        return;
      }
      this.tacticalCards[team].DDOS = true;
      this.roundActiveCard[team] = 'DDOS';
      const durationMs = 2500;
      this.frozenUntil[opponentTeam] = Date.now() + durationMs;

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.CARD_EFFECT_APPLIED, {
        type: 'FREEZE_BUZZER',
        targetTeam: opponentTeam,
        durationMs,
        triggeredByTeam: team,
        playerName: player.name
      });
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.TACTICAL_CARD_ACTIVATED, {
        team,
        cardType: 'DDOS',
        playerName: player.name,
        tacticalCards: this.tacticalCards
      });
      logger.info('GameRoom', `[${this.roomCode}] Team ${team} (${player.name}) activated DDOS on Team ${opponentTeam}`);
    } else if (cardType === TACTICAL_CARDS.FIFTY_FIFTY) {
      const canUse = (this.state === ROOM_STATES.ROUND_ANSWER && this.buzzerWinner?.team === team) ||
                     (this.state === ROOM_STATES.ROUND_REBOUND && this.reboundData?.reboundTeam === team);
      if (!canUse) {
        if (sock) sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, { code: 'INVALID_TIMING', message: 'Thẻ 50/50 chỉ được dùng khi đội bạn đang có quyền trả lời!' });
        return;
      }
      this.tacticalCards[team].FIFTY_FIFTY = true;
      this.roundActiveCard[team] = 'FIFTY_FIFTY';

      const correctIdx = Number(this.currentQuestion.answer_index);
      let wrongIndexes = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
      if (this.state === ROOM_STATES.ROUND_REBOUND && this.reboundData?.eliminatedIndex !== undefined) {
        wrongIndexes = wrongIndexes.filter(idx => idx !== Number(this.reboundData.eliminatedIndex));
      }
      wrongIndexes.sort(() => Math.random() - 0.5);
      const eliminatedIndexes = wrongIndexes.slice(0, 2);

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.FIFTY_FIFTY_RESULT, {
        team,
        eliminatedIndexes
      });
      this.io.to(this.roomCode).emit(SOCKET_EVENTS.TACTICAL_CARD_ACTIVATED, {
        team,
        cardType: 'FIFTY_FIFTY',
        playerName: player.name,
        tacticalCards: this.tacticalCards
      });
      logger.info('GameRoom', `[${this.roomCode}] Team ${team} (${player.name}) activated FIFTY_FIFTY: eliminated [${eliminatedIndexes}]`);
    } else if (cardType === TACTICAL_CARDS.FIREWALL) {
      if (this.state !== ROOM_STATES.ROUND_ANSWER || this.buzzerWinner?.team !== team) {
        if (sock) sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, { code: 'INVALID_TIMING', message: 'Thẻ Tường Lửa chỉ được dùng khi đội bạn đang giữ quyền trả lời chính thức!' });
        return;
      }
      this.tacticalCards[team].FIREWALL = true;
      this.roundActiveCard[team] = 'FIREWALL';

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.TACTICAL_CARD_ACTIVATED, {
        team,
        cardType: 'FIREWALL',
        playerName: player.name,
        tacticalCards: this.tacticalCards
      });
      logger.info('GameRoom', `[${this.roomCode}] Team ${team} (${player.name}) activated FIREWALL`);
    } else if (cardType === TACTICAL_CARDS.DOUBLE_PULL) {
      const canUse = (this.state === ROOM_STATES.ROUND_BUZZ) ||
                     (this.state === ROOM_STATES.ROUND_ANSWER && this.buzzerWinner?.team === team);
      if (!canUse) {
        if (sock) sock.emit(SOCKET_EVENTS.ERROR_MESSAGE, { code: 'INVALID_TIMING', message: 'Thẻ Kháng Cáo (X2) chỉ được dùng trước khi bấm chuông hoặc ngay khi vừa giành chuông!' });
        return;
      }
      this.tacticalCards[team].DOUBLE_PULL = true;
      this.roundActiveCard[team] = 'DOUBLE_PULL';

      this.io.to(this.roomCode).emit(SOCKET_EVENTS.TACTICAL_CARD_ACTIVATED, {
        team,
        cardType: 'DOUBLE_PULL',
        playerName: player.name,
        tacticalCards: this.tacticalCards
      });
      logger.info('GameRoom', `[${this.roomCode}] Team ${team} (${player.name}) activated DOUBLE_PULL`);
    }
  }

  clearRoundTimers() {
    if (this.questionTimer) clearTimeout(this.questionTimer);
    if (this.answerTimer) clearTimeout(this.answerTimer);
    if (this.reboundTimer) clearTimeout(this.reboundTimer);
    if (this.botBuzzTimer) clearTimeout(this.botBuzzTimer);
    if (this.botAnswerTimer) clearTimeout(this.botAnswerTimer);
    if (this.botReboundTimer) clearTimeout(this.botReboundTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.questionTimer = null;
    this.answerTimer = null;
    this.reboundTimer = null;
    this.botBuzzTimer = null;
    this.botAnswerTimer = null;
    this.botReboundTimer = null;
    this.countdownInterval = null;
  }

  // BTC resets the room completely to welcome a new batch of students
  resetForNewBatch() {
    this.clearRoundTimers();
    if (this.matchDurationTimer) clearTimeout(this.matchDurationTimer);

    this.state = ROOM_STATES.LOBBY;
    this.scoreA = 0;
    this.scoreB = 0;
    this.ropeOffset = 0;
    this.roundCount = 0;
    this.currentQuestionIndex = -1;
    this.currentQuestion = null;
    this.buzzerWinner = null;
    this.reboundData = null;
    this.usedQuestionIds = [];

    // Notify connected players
    this.io.to(this.roomCode).emit('roomResetByAdmin', {
      message: 'Ban Tổ Chức đã làm mới phòng để đón lượt sinh viên mới.'
    });

    for (const [socketId] of this.players.entries()) {
      const sock = this.io.sockets.sockets.get(socketId);
      if (sock) sock.leave(this.roomCode);
    }
    this.players.clear();
    this.disconnectedPlayers.clear();
    this.broadcastRoomState();
  }

  broadcastRoomState() {
    const playersList = Array.from(this.players.values());
    const teamA = playersList.filter(p => p.team === TEAMS.A);
    const teamB = playersList.filter(p => p.team === TEAMS.B);

    this.io.to(this.roomCode).emit(SOCKET_EVENTS.ROOM_STATE_UPDATE, {
      roomCode: this.roomCode,
      mode: this.mode,
      maxPerTeam: this.maxPerTeam,
      state: this.state,
      playersCount: playersList.length,
      teamA,
      teamB,
      scoreA: this.scoreA,
      scoreB: this.scoreB,
      ropeOffset: this.ropeOffset,
      tacticalCards: this.tacticalCards,
      isReadyA: teamA.length >= this.maxPerTeam && teamA.every(p => p.isReady),
      isReadyB: teamB.length >= this.maxPerTeam && teamB.every(p => p.isReady),
      deadline: this.currentDeadline
    });
  }
}

module.exports = GameRoom;
