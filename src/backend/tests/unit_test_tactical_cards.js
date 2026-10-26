const assert = require('assert');
const RopeCalculator = require('../src/game/RopeCalculator');
const GameRoom = require('../src/game/GameRoom');
const { ROOM_STATES, TEAMS, TACTICAL_CARDS, SOCKET_EVENTS } = require('../src/config/constants');

console.log('🧪 BẮT ĐẦU UNIT TEST: HỆ THỐNG 4 THẺ BÀI CHIẾN THUẬT (TACTICAL CARDS)...');

// ----------------------------------------------------
// TEST 1: RopeCalculator - Double Pull & Penalty
// ----------------------------------------------------
console.log('\n--- Test 1: RopeCalculator (Double Pull & Penalty) ---');
const rc = new RopeCalculator(10);

// Normal score: Team A +1
const resNormal = rc.applyScore('A', 0, 0, 0, false);
assert.strictEqual(resNormal.scoreA, 1, 'Normal score A should be 1');
assert.strictEqual(resNormal.ropeOffset, -1, 'Normal ropeOffset should be -1');

// Double Pull score: Team A +2
const resDouble = rc.applyScore('A', 1, 0, -1, true);
assert.strictEqual(resDouble.scoreA, 3, 'Double pull score A should be 3');
assert.strictEqual(resDouble.ropeOffset, -3, 'Double pull ropeOffset should be -3');

// Double Pull Penalty: Team A failed -> rope shifted +1 towards Team B
const resPenalty = rc.applyPenalty('A', 3, 0, -3, 1);
assert.strictEqual(resPenalty.ropeOffset, -2, 'Penalty on Team A should move rope towards Team B (+1)');
console.log('✅ Test 1 PASSED: RopeCalculator xử lý Double Pull (+2 nấc) và Penalty (-1 nấc) chính xác!');

// ----------------------------------------------------
// TEST 2: GameRoom Tactical Cards State & Mechanics
// ----------------------------------------------------
console.log('\n--- Test 2: GameRoom Tactical Cards Logic ---');

// Mock socket.io
const mockEvents = [];
const mockSockets = new Map();

const mockIo = {
  emit: (event, payload) => {
    mockEvents.push({ event, payload });
  },
  to: (roomCode) => ({
    emit: (event, payload) => {
      mockEvents.push({ event, payload });
    }
  }),
  sockets: {
    sockets: mockSockets
  }
};

const room = new GameRoom('TEST1', mockIo, { mode: '1vs1', maxPerTeam: 1 });

// Add player A and player B
const socketA = {
  id: 'sockA',
  join: () => {},
  emit: (event, payload) => mockEvents.push({ to: 'sockA', event, payload })
};
const socketB = {
  id: 'sockB',
  join: () => {},
  emit: (event, payload) => mockEvents.push({ to: 'sockB', event, payload })
};
mockSockets.set('sockA', socketA);
mockSockets.set('sockB', socketB);

room.addPlayer(socketA, { sessionToken: 'tokA', fullName: 'Player A', studentId: '231A01', preferredTeam: 'A' });
room.addPlayer(socketB, { sessionToken: 'tokB', fullName: 'Player B', studentId: '231B02', preferredTeam: 'B' });

assert.strictEqual(room.tacticalCards.A.FIREWALL, false, 'Card should not be used initially');
assert.strictEqual(room.tacticalCards.A.DDOS, false);
assert.strictEqual(room.tacticalCards.A.DOUBLE_PULL, false);
assert.strictEqual(room.tacticalCards.A.FIFTY_FIFTY, false);

// Setup questions and start round
room.questions = [
  { id: 1, question: 'Q1', options: ['A', 'B', 'C', 'D'], answer_index: 0, explanation: 'Exp1', category: 'IT' },
  { id: 2, question: 'Q2', options: ['A', 'B', 'C', 'D'], answer_index: 2, explanation: 'Exp2', category: 'LAW' },
  { id: 3, question: 'Q3', options: ['A', 'B', 'C', 'D'], answer_index: 1, explanation: 'Exp3', category: 'IT' }
];
room.state = ROOM_STATES.ROUND_BUZZ;
room.currentQuestionIndex = 0;
room.currentQuestion = room.questions[0];

async function runGameRoomTest() {
  // Test 2.1: Team A activates DDoS in ROUND_BUZZ
  room.handleUseTacticalCard('sockA', TACTICAL_CARDS.DDOS);
  assert.strictEqual(room.tacticalCards.A.DDOS, true, 'Team A DDOS should be marked used');
  assert.strictEqual(room.roundActiveCard.A, 'DDOS', 'Team A round active card should be DDOS');
  assert(room.frozenUntil.B > Date.now(), 'Team B should be frozen');

  // Team B tries to buzz while frozen -> should be rejected!
  room.handleBuzzerPress('sockB');
  assert.strictEqual(room.buzzerWinner, null, 'Team B buzzer press should be blocked while frozen');

  // Team A buzzes -> wait 150ms for BuzzerEngine 120ms RTT window to resolve
  room.handleBuzzerPress('sockA');
  await new Promise(r => setTimeout(r, 160));

  assert(room.buzzerWinner !== null, 'BuzzerWinner should be awarded');
  assert.strictEqual(room.buzzerWinner.team, 'A', 'Team A buzzer should succeed');
  assert.strictEqual(room.state, ROOM_STATES.ROUND_ANSWER);
  console.log('✅ Test 2.1 PASSED: DDoS làm đóng băng chuông đối thủ và từ chối bấm chuông thành công!');

  // Test 2.2: Team A tries to use another card in the same round -> Rejected
  const prevEventsLen = mockEvents.length;
  room.handleUseTacticalCard('sockA', TACTICAL_CARDS.FIFTY_FIFTY);
  const cardLimitErr = mockEvents.slice(prevEventsLen).find(e => e.payload?.code === 'CARD_LIMIT_REACHED');
  assert(cardLimitErr, 'Should emit CARD_LIMIT_REACHED error');
  console.log('✅ Test 2.2 PASSED: Quy tắc cân bằng 1 thẻ/vòng hoạt động chuẩn xác!');

  // Answer question 1 to proceed to next question
  room.submitAnswer('sockA', 0); // Correct answer
  assert.strictEqual(room.scoreA, 1);

  // Move to Question 2
  room.nextQuestion();
  assert.strictEqual(room.roundActiveCard.A, null, 'roundActiveCard should be reset for new round');
  assert.strictEqual(room.frozenUntil.B, 0, 'frozenUntil should be reset');

  // Test 2.3: 50/50 Card in Question 2
  // Team B buzzes
  room.handleBuzzerPress('sockB');
  await new Promise(r => setTimeout(r, 160));
  assert.strictEqual(room.buzzerWinner.team, 'B');

  // Team B activates FIFTY_FIFTY
  const eventsBefore50 = mockEvents.length;
  room.handleUseTacticalCard('sockB', TACTICAL_CARDS.FIFTY_FIFTY);
  assert.strictEqual(room.tacticalCards.B.FIFTY_FIFTY, true, 'Team B 50/50 should be marked used');

  const f50Event = mockEvents.slice(eventsBefore50).find(e => e.event === SOCKET_EVENTS.FIFTY_FIFTY_RESULT);
  assert(f50Event, 'Should emit fiftyFiftyResult');
  assert.strictEqual(f50Event.payload.eliminatedIndexes.length, 2, 'Should eliminate exactly 2 options');
  assert(!f50Event.payload.eliminatedIndexes.includes(room.currentQuestion.answer_index), 'Should NOT eliminate the correct answer');
  console.log('✅ Test 2.3 PASSED: Thẻ Luật Sư 50/50 loại trừ 2 đáp án sai ngẫu nhiên chuẩn xác!');

  // Finish Q2
  room.submitAnswer('sockB', 2); // Correct answer
  assert.strictEqual(room.scoreB, 1);

  // Move to Question 3
  room.nextQuestion();

  // Test 2.4: FIREWALL (Tường Lửa)
  // Team A buzzes
  room.handleBuzzerPress('sockA');
  await new Promise(r => setTimeout(r, 160));
  assert.strictEqual(room.buzzerWinner.team, 'A');

  // Team A activates FIREWALL
  room.handleUseTacticalCard('sockA', TACTICAL_CARDS.FIREWALL);
  assert.strictEqual(room.tacticalCards.A.FIREWALL, true);

  // Team A answers INCORRECTLY!
  const eventsBeforeAns = mockEvents.length;
  room.submitAnswer('sockA', 3); // wrong answer (correct is 1)

  const ansResult = mockEvents.slice(eventsBeforeAns).find(e => e.event === SOCKET_EVENTS.ANSWER_RESULT);
  assert(ansResult, 'Should emit answerResult');
  assert.strictEqual(ansResult.payload.blockedByFirewall, true, 'Firewall should block rebound');
  assert.strictEqual(room.reboundData, null, 'reboundData should remain null when blocked by Firewall');
  console.log('✅ Test 2.4 PASSED: Thẻ Tường Lửa chặn đứng pha Rebound của đối phương thành công!');

  console.log('\n🎉 TẤT CẢ UNIT TESTS ĐỀU ĐẠT 100% THÀNH CÔNG!\n');
  process.exit(0);
}

runGameRoomTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
