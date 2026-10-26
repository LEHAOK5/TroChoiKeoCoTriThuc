module.exports = {
  ROOM_STATES: {
    LOBBY: 'LOBBY',
    COUNTDOWN: 'COUNTDOWN',
    ROUND_BUZZ: 'ROUND_BUZZ',
    ROUND_ANSWER: 'ROUND_ANSWER',
    ROUND_REBOUND: 'ROUND_REBOUND',
    PAUSED: 'PAUSED',
    FINISHED: 'FINISHED'
  },
  TEAMS: {
    A: 'A',
    B: 'B'
  },
  TEAM_NAMES: {
    A: 'Đội A - Tia Chớp',
    B: 'Đội B - Ngọn Lửa'
  },
  CATEGORIES: {
    IT: 'IT',
    LAW: 'LAW'
  },
  END_REASONS: {
    SCORE: 'SCORE',       // Đạt 10 điểm
    TIMEOUT: 'TIMEOUT',   // Hết thời gian trận
    FORFEIT: 'FORFEIT'    // Đối thủ bỏ cuộc
  },
  SOCKET_EVENTS: {
    // Client -> Server
    JOIN_ROOM: 'joinRoom',
    SWITCH_TEAM: 'switchTeam',
    SET_READY: 'setReady',
    PRESS_BUZZER: 'pressBuzzer',
    SUBMIT_ANSWER: 'submitAnswer',
    REQUEST_REMATCH: 'requestRematch',
    LEAVE_ROOM: 'leaveRoom',
    RESUME_SESSION: 'resumeSession',
    ADD_BOT: 'addBot',
    PONG: 'pong',
    USE_TACTICAL_CARD: 'useTacticalCard',

    // Server -> Client
    ROOM_STATE_UPDATE: 'roomStateUpdate',
    START_COUNTDOWN: 'startCountdown',
    NEW_QUESTION: 'newQuestion',
    BUZZER_AWARDED: 'buzzerAwarded',
    ANSWER_RESULT: 'answerResult',
    REBOUND_OPEN: 'reboundOpen',
    BOTH_TEAMS_WRONG: 'bothTeamsWrong',
    GAME_OVER: 'gameOver',
    PING: 'ping',
    PLAYER_STATUS: 'playerStatus',
    ERROR_MESSAGE: 'errorMessage',
    TACTICAL_CARD_ACTIVATED: 'tacticalCardActivated',
    CARD_EFFECT_APPLIED: 'cardEffectApplied',
    FIFTY_FIFTY_RESULT: 'fiftyFiftyResult'
  },
  TACTICAL_CARDS: {
    FIREWALL: 'FIREWALL',
    DDOS: 'DDOS',
    DOUBLE_PULL: 'DOUBLE_PULL',
    FIFTY_FIFTY: 'FIFTY_FIFTY'
  }
};
