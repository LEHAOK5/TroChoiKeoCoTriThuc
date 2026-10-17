const { query } = require('../db/pool');

async function getRandomQuestions(limit = 30, excludeIds = []) {
  try {
    const half = Math.ceil(limit / 2);
    
    // For IT
    const itSql = `
      SELECT id, category, question, options, answer_index, explanation
      FROM questions
      WHERE category = 'IT' ${excludeIds.length > 0 ? `AND id != ALL($2::int[])` : ''}
      ORDER BY RANDOM()
      LIMIT $1;
    `;
    
    // For LAW
    const lawSql = `
      SELECT id, category, question, options, answer_index, explanation
      FROM questions
      WHERE category = 'LAW' ${excludeIds.length > 0 ? `AND id != ALL($2::int[])` : ''}
      ORDER BY RANDOM()
      LIMIT $1;
    `;

    const [itRes, lawRes] = await Promise.all([
      query(itSql, excludeIds.length > 0 ? [half, excludeIds] : [half]),
      query(lawSql, excludeIds.length > 0 ? [half, excludeIds] : [half])
    ]);

    let combined = [...itRes.rows, ...lawRes.rows];
    
    // If combined has fewer than limit (e.g. if one category has 0 questions or fewer than half), fill remainder
    if (combined.length < limit) {
      const alreadyFetchedIds = [...excludeIds, ...combined.map(q => q.id)];
      const needed = limit - combined.length;
      const fillSql = `
        SELECT id, category, question, options, answer_index, explanation
        FROM questions
        ${alreadyFetchedIds.length > 0 ? `WHERE id != ALL($2::int[])` : ''}
        ORDER BY RANDOM()
        LIMIT $1;
      `;
      const fillRes = await query(fillSql, alreadyFetchedIds.length > 0 ? [needed, alreadyFetchedIds] : [needed]);
      combined.push(...fillRes.rows);
    }

    // Fallback: If excluded questions exhausted table, fetch without exclusion
    if (combined.length === 0) {
      const fallbackRes = await query(`SELECT id, category, question, options, answer_index, explanation FROM questions ORDER BY RANDOM() LIMIT $1;`, [limit]);
      combined = fallbackRes.rows;
    }

    return combined.sort(() => Math.random() - 0.5);
  } catch (err) {
    console.error('[QuestionRepo] Error getting random questions:', err.message);
    return [];
  }
}

async function getAllQuestions({ category = null, limit = 50, offset = 0 } = {}) {
  let sql = `SELECT id, category, question, options, answer_index, explanation, created_at FROM questions`;
  const params = [];
  if (category) {
    sql += ` WHERE category = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`;
    params.push(category, limit, offset);
  } else {
    sql += ` ORDER BY id DESC LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }
  const res = await query(sql, params);
  return res.rows;
}

async function countQuestions() {
  const res = await query(`
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE category = 'IT') AS total_it,
      COUNT(*) FILTER (WHERE category = 'LAW') AS total_law
    FROM questions;
  `);
  return res.rows[0];
}

async function createQuestion({ category, question, options, answer_index, explanation = '' }) {
  const sql = `
    INSERT INTO questions (category, question, options, answer_index, explanation)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const res = await query(sql, [category, question, JSON.stringify(options), answer_index, explanation]);
  return res.rows[0];
}

async function updateQuestion(id, { category, question, options, answer_index, explanation }) {
  const sql = `
    UPDATE questions
    SET category = COALESCE($1, category),
        question = COALESCE($2, question),
        options = COALESCE($3, options),
        answer_index = COALESCE($4, answer_index),
        explanation = COALESCE($5, explanation)
    WHERE id = $6
    RETURNING *;
  `;
  const res = await query(sql, [
    category,
    question,
    options ? JSON.stringify(options) : null,
    answer_index,
    explanation,
    id
  ]);
  return res.rows[0];
}

async function deleteQuestion(id) {
  const res = await query(`DELETE FROM questions WHERE id = $1 RETURNING id;`, [id]);
  return res.rowCount > 0;
}

module.exports = {
  getRandomQuestions,
  getAllQuestions,
  countQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
