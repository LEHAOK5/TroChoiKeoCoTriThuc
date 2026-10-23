const { query } = require('../db/pool');
const logger = require('../utils/logger');

let isTableInitialized = false;

// Đảm bảo bảng match_participants tồn tại tự động trên Supabase / PostgreSQL
async function ensureTableExists() {
  if (isTableInitialized) return;
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS match_participants (
        id SERIAL PRIMARY KEY,
        match_code TEXT NOT NULL,
        room_code TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        faculty TEXT DEFAULT '',
        team TEXT NOT NULL CHECK (team IN ('A', 'B')),
        result TEXT NOT NULL DEFAULT 'PLAYING' CHECK (result IN ('PLAYING', 'WIN', 'LOSE', 'DRAW')),
        reward_claimed BOOLEAN DEFAULT FALSE,
        claimed_at TIMESTAMPTZ,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        finished_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_match_participants_student_id ON match_participants(student_id);
      CREATE INDEX IF NOT EXISTS idx_match_participants_match_code ON match_participants(match_code);
    `;
    await query(ddl);
    isTableInitialized = true;
  } catch (err) {
    logger.warn('ParticipantRepo', `Không thể tự động khởi tạo bảng match_participants: ${err.message}`);
  }
}

/**
 * Ghi nhận sinh viên tham gia phòng đấu (trạng thái: 'PLAYING')
 */
async function recordParticipantJoin({ matchCode, roomCode, studentId, studentName, faculty = '', team }) {
  await ensureTableExists();
  try {
    // Nếu sinh viên đã có bản ghi PLAYING trong roomCode này, cập nhật lại team
    const checkSql = `
      SELECT id FROM match_participants 
      WHERE room_code = $1 AND student_id = $2 AND result = 'PLAYING' 
      ORDER BY id DESC LIMIT 1;
    `;
    const checkRes = await query(checkSql, [roomCode, studentId]);

    if (checkRes.rows.length > 0) {
      const updateSql = `
        UPDATE match_participants 
        SET team = $1, match_code = $2, student_name = $3, faculty = COALESCE(NULLIF($4, ''), faculty), joined_at = NOW()
        WHERE id = $5
        RETURNING *;
      `;
      const updateRes = await query(updateSql, [team, matchCode, studentName, faculty, checkRes.rows[0].id]);
      return updateRes.rows[0];
    }

    const insertSql = `
      INSERT INTO match_participants (match_code, room_code, student_id, student_name, faculty, team, result)
      VALUES ($1, $2, $3, $4, $5, $6, 'PLAYING')
      RETURNING *;
    `;
    const res = await query(insertSql, [matchCode, roomCode, studentId, studentName, faculty, team]);
    return res.rows[0];
  } catch (err) {
    logger.error('ParticipantRepo', `Lỗi recordParticipantJoin: ${err.message}`);
    return null;
  }
}

/**
 * Cập nhật kết quả thắng / thua khi trận đấu kết thúc
 */
async function updateParticipantsResult({ matchCode, roomCode, winner }) {
  await ensureTableExists();
  try {
    const winResult = winner === 'DRAW' ? 'DRAW' : 'WIN';
    const loseResult = winner === 'DRAW' ? 'DRAW' : 'LOSE';

    // Cập nhật đội thắng
    if (winner === 'A' || winner === 'B') {
      const winSql = `
        UPDATE match_participants
        SET result = 'WIN', finished_at = NOW(), match_code = $1
        WHERE (room_code = $2 OR match_code = $1) AND team = $3 AND result = 'PLAYING'
        RETURNING *;
      `;
      await query(winSql, [matchCode, roomCode, winner]);

      // Cập nhật đội thua
      const loserTeam = winner === 'A' ? 'B' : 'A';
      const loseSql = `
        UPDATE match_participants
        SET result = 'LOSE', finished_at = NOW(), match_code = $1
        WHERE (room_code = $2 OR match_code = $1) AND team = $3 AND result = 'PLAYING'
        RETURNING *;
      `;
      await query(loseSql, [matchCode, roomCode, loserTeam]);
    } else {
      // Hòa
      const drawSql = `
        UPDATE match_participants
        SET result = 'DRAW', finished_at = NOW(), match_code = $1
        WHERE (room_code = $2 OR match_code = $1) AND result = 'PLAYING'
        RETURNING *;
      `;
      await query(drawSql, [matchCode, roomCode]);
    }

    // Trả về danh sách thí sinh vừa cập nhật
    const listSql = `SELECT * FROM match_participants WHERE match_code = $1;`;
    const res = await query(listSql, [matchCode]);
    return res.rows;
  } catch (err) {
    logger.error('ParticipantRepo', `Lỗi updateParticipantsResult: ${err.message}`);
    return [];
  }
}

/**
 * Lấy danh sách sinh viên kết hợp thông tin đăng ký + kết quả thi đấu thời gian thực
 */
async function getStudentsWithMatchStatus({ search = '', limit = 200, offset = 0 } = {}) {
  await ensureTableExists();
  try {
    // Truy vấn danh sách sinh viên kèm thống kê trận đấu & kết quả trận mới nhất
    const sql = `
      WITH last_p AS (
        SELECT DISTINCT ON (student_id)
          id AS last_participant_id,
          student_id,
          room_code AS last_room_code,
          match_code AS last_match_code,
          team AS last_team,
          result AS last_result,
          reward_claimed,
          claimed_at,
          joined_at AS last_joined_at
        FROM match_participants
        ORDER BY student_id, id DESC
      ),
      stats AS (
        SELECT 
          student_id,
          COUNT(*) AS total_matches,
          COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
          COUNT(*) FILTER (WHERE result = 'LOSE') AS losses,
          COUNT(*) FILTER (WHERE result = 'PLAYING') AS playing_count,
          BOOL_OR(reward_claimed) AS has_claimed_any
        FROM match_participants
        GROUP BY student_id
      )
      SELECT 
        b.id,
        b.full_name,
        b.student_id,
        b.phone,
        b.faculty,
        b.registered_at,
        COALESCE(s.total_matches, 0) AS total_matches,
        COALESCE(s.wins, 0) AS wins,
        COALESCE(s.losses, 0) AS losses,
        COALESCE(s.wins, 0) AS total_wins,
        COALESCE(s.losses, 0) AS total_losses,
        lp.last_participant_id,
        lp.last_room_code,
        lp.last_match_code,
        lp.last_team,
        COALESCE(lp.last_result, 'NOT_PLAYED') AS last_result,
        COALESCE(lp.last_result, 'NOT_PLAYED') AS current_status,
        COALESCE(lp.reward_claimed, false) AS reward_claimed,
        lp.claimed_at,
        lp.last_joined_at
      FROM booth_registrations b
      LEFT JOIN last_p lp ON b.student_id = lp.student_id
      LEFT JOIN stats s ON b.student_id = s.student_id
      WHERE (
        $1 = '' OR 
        b.full_name ILIKE '%' || $1 || '%' OR 
        b.student_id ILIKE '%' || $1 || '%' OR 
        b.faculty ILIKE '%' || $1 || '%' OR 
        b.phone ILIKE '%' || $1 || '%'
      )
      ORDER BY 
        CASE WHEN lp.last_result = 'PLAYING' THEN 0 ELSE 1 END,
        b.id DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await query(sql, [search.trim(), limit, offset]);
    return res.rows;
  } catch (err) {
    logger.error('ParticipantRepo', `Lỗi getStudentsWithMatchStatus: ${err.message}`);
    // Fallback sang bảng booth_registrations nếu bảng match_participants chưa có dữ liệu
    const fallbackSql = `
      SELECT id, full_name, student_id, phone, faculty, registered_at,
             0 AS total_matches, 0 AS wins, 0 AS losses,
             'NOT_PLAYED' AS current_status, false AS reward_claimed
      FROM booth_registrations
      WHERE ($1 = '' OR full_name ILIKE '%' || $1 || '%' OR student_id ILIKE '%' || $1 || '%')
      ORDER BY id DESC LIMIT $2 OFFSET $3;
    `;
    const res = await query(fallbackSql, [search.trim(), limit, offset]);
    return res.rows;
  }
}

/**
 * Lấy toàn bộ lịch sử thi đấu chi tiết của 1 sinh viên theo MSSV
 */
async function getStudentMatchHistory(studentId) {
  await ensureTableExists();
  const cleanId = (studentId || '').trim();
  if (!cleanId) return [];

  try {
    const sql = `
      SELECT 
        p.id,
        p.id AS participant_id,
        p.match_code,
        p.room_code,
        p.student_id,
        p.student_name,
        p.team,
        p.result,
        COALESCE(p.reward_claimed, false) AS reward_claimed,
        p.claimed_at,
        p.joined_at,
        COALESCE(p.finished_at, m.finished_at, p.joined_at) AS finished_at,
        COALESCE(m.score_a, 0) AS score_a,
        COALESCE(m.score_b, 0) AS score_b,
        COALESCE(m.winner, 'DRAW') AS winner,
        COALESCE(m.team_a_name, 'Đội A') AS team_a_name,
        COALESCE(m.team_b_name, 'Đội B') AS team_b_name
      FROM match_participants p
      LEFT JOIN match_history m ON (p.match_code = m.match_code OR p.room_code = m.match_code)
      WHERE p.student_id = $1
      ORDER BY p.id DESC;
    `;
    const res = await query(sql, [cleanId]);
    if (res.rows.length > 0) {
      return res.rows;
    }

    // Fallback: Tìm trong match_history nếu trận đấu được lưu trước đó
    const legacySql = `
      SELECT 
        m.id,
        m.id AS participant_id,
        m.match_code,
        m.match_code AS room_code,
        $1 AS student_id,
        $1 AS student_name,
        CASE 
          WHEN m.team_a_players::text ILIKE '%' || $1 || '%' THEN 'A'
          ELSE 'B'
        END AS team,
        CASE 
          WHEN (m.team_a_players::text ILIKE '%' || $1 || '%' AND m.winner = 'A') OR
               (m.team_b_players::text ILIKE '%' || $1 || '%' AND m.winner = 'B') THEN 'WIN'
          WHEN m.winner = 'DRAW' THEN 'DRAW'
          ELSE 'LOSE'
        END AS result,
        FALSE AS reward_claimed,
        NULL AS claimed_at,
        m.started_at AS joined_at,
        m.finished_at,
        COALESCE(m.score_a, 0) AS score_a,
        COALESCE(m.score_b, 0) AS score_b,
        m.winner,
        m.team_a_name,
        m.team_b_name
      FROM match_history m
      WHERE m.team_a_players::text ILIKE '%' || $1 || '%' OR m.team_b_players::text ILIKE '%' || $1 || '%'
      ORDER BY m.id DESC;
    `;
    const legacyRes = await query(legacySql, [cleanId]);
    return legacyRes.rows;
  } catch (err) {
    logger.error('ParticipantRepo', `Lỗi getStudentMatchHistory: ${err.message}`);
    return [];
  }
}

/**
 * Đánh dấu đã trao quà cho một lượt thi đấu
 */
async function claimParticipantReward(participantId) {
  await ensureTableExists();
  try {
    const sql = `
      UPDATE match_participants
      SET reward_claimed = TRUE, claimed_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const res = await query(sql, [participantId]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error('ParticipantRepo', `Lỗi claimParticipantReward: ${err.message}`);
    return null;
  }
}

module.exports = {
  recordParticipantJoin,
  updateParticipantsResult,
  getStudentsWithMatchStatus,
  getStudentMatchHistory,
  claimParticipantReward
};
