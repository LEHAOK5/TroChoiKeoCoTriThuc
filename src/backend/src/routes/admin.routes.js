const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const adminAuth = require('../middlewares/adminAuth');
const { findAdminByUsername, updateLastLogin } = require('../repositories/admin.repository');
const { countRegistrations, getAllRegistrations } = require('../repositories/registration.repository');
const { countQuestions, getAllQuestions, createQuestion, updateQuestion, deleteQuestion } = require('../repositories/question.repository');
const { getMatchStats, getRecentMatches } = require('../repositories/match.repository');
const {
  getStudentsWithMatchStatus,
  getStudentMatchHistory,
  claimParticipantReward
} = require('../repositories/participant.repository');
const { ROOM_STATES } = require('../config/constants');

function createAdminRouter(roomManager) {
  const router = express.Router();

  // --- 1. PUBLIC ROUTE: Admin Login ---
  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Tên đăng nhập và mật khẩu là bắt buộc' }
        });
      }

      const adminUser = await findAdminByUsername(username.trim());
      if (!adminUser) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác' }
        });
      }

      const isMatch = bcrypt.compareSync(password, adminUser.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác' }
        });
      }

      // Update last login
      await updateLastLogin(adminUser.id);

      // Sign JWT token valid for 24h
      const token = jwt.sign(
        {
          adminId: adminUser.id,
          username: adminUser.username,
          full_name: adminUser.full_name,
          role: adminUser.role || 'BOOTH_STAFF'
        },
        config.SESSION_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          full_name: adminUser.full_name,
          role: adminUser.role
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // --- ALL ROUTES BELOW REQUIRE ADMIN AUTHENTICATION ---
  router.use(adminAuth);

  // --- 2. Room Management by Admin / BTC ---
  router.post('/rooms/create', (req, res) => {
    try {
      const { mode = '1vs1', customCode = null } = req.body || {};
      const validModes = ['1vs1', '2vs2', '3vs3', '4vs4', '5vs5'];
      const selectedMode = validModes.includes(mode) ? mode : '1vs1';

      const room = roomManager.createRoom({
        mode: selectedMode,
        customCode: customCode ? customCode.trim() : null
      });

      res.json({
        success: true,
        room: {
          roomCode: room.roomCode,
          mode: room.mode,
          maxPerTeam: room.maxPerTeam,
          state: room.state
        }
      });
    } catch (err) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Force start countdown from Admin (Requires both teams to have reached maxPerTeam)
  router.post('/rooms/:roomCode/start', (req, res) => {
    const room = roomManager.getRoom(req.params.roomCode);
    if (!room) {
      return res.status(404).json({ error: { message: 'Phòng không tồn tại' } });
    }

    if (room.state !== ROOM_STATES.LOBBY) {
      return res.status(400).json({ error: { message: `Phòng đang ở trạng thái ${room.state}, không thể bắt đầu` } });
    }

    const playersA = room.getTeamPlayers('A');
    const playersB = room.getTeamPlayers('B');
    if (playersA.length < room.maxPerTeam || playersB.length < room.maxPerTeam) {
      return res.status(400).json({
        error: {
          code: 'NOT_ENOUGH_PLAYERS',
          message: `Chưa đủ thành viên cả 2 đội! Cần ${room.maxPerTeam} người mỗi đội (Hiện có Đội A: ${playersA.length}/${room.maxPerTeam}, Đội B: ${playersB.length}/${room.maxPerTeam}).`
        }
      });
    }

    const unreadyA = playersA.filter(p => !p.isReady);
    const unreadyB = playersB.filter(p => !p.isReady);
    if (unreadyA.length > 0 || unreadyB.length > 0) {
      const unreadyNames = [...unreadyA, ...unreadyB].map(p => p.name).join(', ');
      return res.status(400).json({
        error: {
          code: 'NOT_ALL_READY',
          message: `Chưa thể bắt đầu! Còn người chơi chưa bấm sẵn sàng: ${unreadyNames}. Cần tất cả ${room.maxPerTeam * 2} người chơi sẵn sàng!`
        }
      });
    }

    room.startCountdown();
    res.json({
      success: true,
      roomCode: room.roomCode,
      state: room.state
    });
  });

  // Reset room to welcome new batch of students
  router.post('/rooms/:roomCode/reset', (req, res) => {
    const room = roomManager.getRoom(req.params.roomCode);
    if (!room) {
      return res.status(404).json({ error: { message: 'Phòng không tồn tại' } });
    }

    room.resetForNewBatch();
    res.json({
      success: true,
      roomCode: room.roomCode,
      state: room.state
    });
  });

  // Close room
  router.delete('/rooms/:roomCode', (req, res) => {
    const success = roomManager.closeRoom(req.params.roomCode);
    res.json({ success });
  });

  // 3. Overall Stats
  router.get('/stats', async (req, res, next) => {
    try {
      const [regCount, qCounts, mStats] = await Promise.all([
        countRegistrations(),
        countQuestions(),
        getMatchStats()
      ]);

      res.json({
        success: true,
        stats: {
          totalRegistrations: regCount,
          totalQuestions: qCounts.total,
          questionsIT: qCounts.total_it,
          questionsLAW: qCounts.total_law,
          totalMatches: mStats.total_matches,
          winsA: mStats.wins_a,
          winsB: mStats.wins_b,
          activeRoomsCount: roomManager ? roomManager.rooms.size : 0
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // 4. Registrations list or CSV export
  router.get('/registrations', async (req, res, next) => {
    try {
      const format = req.query.format;
      if (format === 'csv') {
        const fullList = await getStudentsWithMatchStatus({ limit: 2000 });
        let csv = '\uFEFFID,Họ và Tên,MSSV,Khoa,Số Điện Thoại,Ngày Đăng Ký,Tổng Trận Đấu,Trận Thắng,Trận Thua,Trạng Thái Gần Nhất,Nhận Quà\n';
        for (const row of fullList) {
          const statusText = row.current_status === 'WIN' ? 'CHIẾN THẮNG' :
                             row.current_status === 'LOSE' ? 'BỊ BẮT TÙ' :
                             row.current_status === 'PLAYING' ? 'ĐANG THI ĐẤU' : 'CHƯA ĐẤU';
          const rewardText = row.reward_claimed ? 'ĐÃ NHẬN QUÀ' : 'CHƯA NHẬN';
          csv += `"${row.id}","${row.full_name}","${row.student_id}","${row.faculty || ''}","${row.phone || ''}","${row.registered_at || ''}","${row.total_matches}","${row.wins}","${row.losses}","${statusText}","${rewardText}"\n`;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_sinh_vien_ket_qua.csv"');
        return res.send(csv);
      }

      const list = await getAllRegistrations({ limit: 1000 });
      res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  });

  // 4a. Danh sách sinh viên kèm kết quả thi đấu & trạng thái nhận quà
  router.get('/students', async (req, res, next) => {
    try {
      const search = req.query.search || '';
      const limit = parseInt(req.query.limit, 10) || 200;
      const offset = parseInt(req.query.offset, 10) || 0;
      const list = await getStudentsWithMatchStatus({ search, limit, offset });
      res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  });

  // 4b. Lịch sử chi tiết các ván đấu của 1 sinh viên theo MSSV
  router.get('/students/:studentId/history', async (req, res, next) => {
    try {
      const { studentId } = req.params;
      const history = await getStudentMatchHistory(studentId.trim());
      res.json({ success: true, studentId: studentId.trim(), count: history.length, history });
    } catch (err) {
      next(err);
    }
  });

  // 4c. Xác nhận đã phát quà cho một lượt thi đấu (Hỗ trợ cả POST và PATCH)
  const handleClaimReward = async (req, res, next) => {
    try {
      const participantId = parseInt(req.params.participantId, 10);
      const updated = await claimParticipantReward(participantId);
      if (!updated) {
        return res.status(404).json({ error: { message: 'Không tìm thấy lượt thi đấu để trao quà' } });
      }
      res.json({ success: true, participant: updated });
    } catch (err) {
      next(err);
    }
  };
  router.patch('/participants/:participantId/claim', handleClaimReward);
  router.post('/participants/:participantId/claim', handleClaimReward);

  // 4b. Match history list
  router.get('/matches', async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 100;
      const matches = await getRecentMatches(limit);
      res.json({ success: true, count: matches.length, matches });
    } catch (err) {
      next(err);
    }
  });

  // 5. Live active rooms
  router.get('/rooms', (req, res) => {
    const rooms = roomManager ? roomManager.listRooms() : [];
    res.json({ success: true, count: rooms.length, rooms });
  });

  // 6. Questions CRUD
  router.get('/questions', async (req, res, next) => {
    try {
      const category = req.query.category || null;
      const questions = await getAllQuestions({ category, limit: 100 });
      res.json({ success: true, count: questions.length, questions });
    } catch (err) {
      next(err);
    }
  });

  router.post('/questions', async (req, res, next) => {
    try {
      const { category, question, options, answer_index, explanation } = req.body;
      const newQ = await createQuestion({ category, question, options, answer_index, explanation });
      res.json({ success: true, question: newQ });
    } catch (err) {
      next(err);
    }
  });

  router.put('/questions/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateQuestion(id, req.body);
      res.json({ success: true, question: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/questions/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await deleteQuestion(id);
      res.json({ success });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createAdminRouter;
