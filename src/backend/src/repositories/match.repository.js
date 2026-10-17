const { query } = require('../db/pool');

async function saveMatch({
  matchCode,
  roomCode = '',
  teamAName = 'Đội A - Tia Chớp',
  teamBName = 'Đội B - Ngọn Lửa',
  teamAPlayers = [],
  teamBPlayers = [],
  scoreA = 0,
  scoreB = 0,
  winner = 'DRAW',
  endReason = 'SCORE',
  totalQuestions = 0,
  startedAt = new Date(),
  finishedAt = new Date()
}) {
  const sql = `
    INSERT INTO match_history (
      match_code, team_a_name, team_b_name, team_a_players, team_b_players,
      score_a, score_b, winner, total_questions, started_at, finished_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (match_code) DO UPDATE
    SET score_a = EXCLUDED.score_a,
        score_b = EXCLUDED.score_b,
        winner = EXCLUDED.winner,
        finished_at = EXCLUDED.finished_at
    RETURNING *;
  `;
  const res = await query(sql, [
    matchCode,
    teamAName,
    teamBName,
    JSON.stringify(teamAPlayers),
    JSON.stringify(teamBPlayers),
    scoreA,
    scoreB,
    winner,
    totalQuestions,
    startedAt,
    finishedAt
  ]);
  return res.rows[0];
}

async function getMatchByCode(matchCode) {
  const sql = `SELECT * FROM match_history WHERE match_code = $1;`;
  const res = await query(sql, [matchCode]);
  return res.rows[0] || null;
}

async function getRecentMatches(limit = 20) {
  const sql = `SELECT * FROM match_history ORDER BY id DESC LIMIT $1;`;
  const res = await query(sql, [limit]);
  return res.rows;
}

async function getMatchStats() {
  const sql = `
    SELECT 
      COUNT(*) AS total_matches,
      COUNT(*) FILTER (WHERE winner = 'A') AS wins_a,
      COUNT(*) FILTER (WHERE winner = 'B') AS wins_b,
      COUNT(*) FILTER (WHERE winner = 'DRAW') AS draws,
      COALESCE(AVG(total_questions), 0) AS avg_questions_per_match
    FROM match_history;
  `;
  const res = await query(sql);
  return res.rows[0];
}

async function getLeaderboard() {
  // Return recent victorious matches
  const sql = `
    SELECT 
      match_code, team_a_name, team_b_name, score_a, score_b, winner, finished_at
    FROM match_history
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at DESC
    LIMIT 10;
  `;
  const res = await query(sql);
  return res.rows;
}

module.exports = {
  saveMatch,
  getMatchByCode,
  getRecentMatches,
  getMatchStats,
  getLeaderboard
};
