const { io } = require('socket.io-client');
const http = require('http');

const API_URL = 'http://localhost:4000';

async function postJson(url, data) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runE2ETest() {
  console.log('====================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ E2E TỔNG THỂ BACKEND v2.0');
  console.log('====================================================');

  // 1. Đăng ký 2 sinh viên qua REST API
  console.log('\n[1] Đăng ký sinh viên Đội A & Đội B:');
  const regA = await postJson(`${API_URL}/api/register`, {
    fullName: 'Lê Văn A (Tia Chớp)',
    studentId: 'SV2026-A1',
    faculty: 'CNTT',
    phone: '0901112233'
  });
  console.log(' -> Đội A đăng ký thành công! Token:', regA.data.sessionToken.slice(0, 30) + '...');

  const regB = await postJson(`${API_URL}/api/register`, {
    fullName: 'Trần Thị B (Ngọn Lửa)',
    studentId: 'SV2026-B1',
    faculty: 'Luật Dân Sự',
    phone: '0904445566'
  });
  console.log(' -> Đội B đăng ký thành công! Token:', regB.data.sessionToken.slice(0, 30) + '...');

  // 2. Ghép trận nhanh
  console.log('\n[2] Gọi API Ghép trận nhanh (/api/rooms/quick-match):');
  const matchRes = await postJson(`${API_URL}/api/rooms/quick-match`, {});
  const roomCode = matchRes.data.roomCode;
  console.log(` -> Đã tìm/tạo phòng thi đấu: [${roomCode}]`);

  // 3. Kết nối WebSocket 2 client
  console.log('\n[3] Kết nối 2 client qua WebSocket:');
  const socketA = io(API_URL, { transports: ['websocket'] });
  const socketB = io(API_URL, { transports: ['websocket'] });

  await Promise.all([
    new Promise(res => socketA.on('connect', res)),
    new Promise(res => socketB.on('connect', res))
  ]);
  console.log(' -> Cả 2 socket đã kết nối thành công!');

  // 4. Tham gia phòng
  socketA.emit('joinRoom', {
    roomCode,
    sessionToken: regA.data.sessionToken,
    preferredTeam: 'A'
  });

  socketB.emit('joinRoom', {
    roomCode,
    sessionToken: regB.data.sessionToken,
    preferredTeam: 'B'
  });

  await new Promise(r => setTimeout(r, 500));

  // 5. Cả 2 đội bấm SẴN SÀNG
  console.log('\n[4] Hai đội bấm SẴN SÀNG:');
  socketA.emit('setReady', { isReady: true });
  socketB.emit('setReady', { isReady: true });

  // 6. Nhận đếm ngược và câu hỏi đầu tiên
  const question = await new Promise(resolve => {
    socketA.on('newQuestion', ({ question, scoreA, scoreB }) => {
      console.log(` -> Câu hỏi mới: "${question.question.slice(0, 50)}..." [Lĩnh vực: ${question.category}]`);
      resolve(question);
    });
  });

  // 7. Thử nghiệm bấm chuông giành quyền
  console.log('\n[5] Đội A bấm chuông giành quyền:');
  socketA.emit('pressBuzzer', { roomCode });

  const buzzerData = await new Promise(resolve => {
    socketA.on('buzzerAwarded', resolve);
  });
  console.log(` -> Chuông được trao cho: ${buzzerData.team} (${buzzerData.playerName})!`);

  // 8. Đội A nộp đáp án
  console.log('\n[6] Đội A gửi đáp án (Option index: 1):');
  socketA.emit('submitAnswer', { roomCode, answerIndex: 1 });

  await new Promise(resolve => {
    socketA.on('answerResult', (result) => {
      console.log(` -> Kết quả chấm: Đúng=${result.isCorrect}. Tỷ số hiện tại: Đội A=${result.scoreA} - Đội B=${result.scoreB}. RopeOffset: ${result.ropeOffset}`);
      resolve();
    });
    socketA.on('reboundOpen', (result) => {
      console.log(` -> Đội A sai! Mở quyền cướp điểm cho Đội ${result.reboundTeam}. Đáp án sai bị loại: ${result.eliminatedIndex}`);
      resolve();
    });
  });

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n====================================================');
  console.log('   TẤT CẢ CÁC BƯỚC KIỂM THỬ E2E HOÀN TOÀN THÀNH CÔNG!');
  console.log('====================================================');
  process.exit(0);
}

runE2ETest().catch(err => {
  console.error('Lỗi kiểm thử E2E:', err);
  process.exit(1);
});
