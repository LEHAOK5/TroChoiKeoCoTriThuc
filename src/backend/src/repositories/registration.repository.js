const { query } = require('../db/pool');

async function saveRegistration({ fullName, studentId, phone = '', faculty = '', consent = true }) {
  const sql = `
    INSERT INTO booth_registrations (full_name, student_id, phone, faculty)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, student_id, phone, faculty, registered_at;
  `;
  const res = await query(sql, [fullName, studentId, phone, faculty]);
  return res.rows[0];
}

async function getAllRegistrations({ limit = 100, offset = 0 } = {}) {
  const sql = `
    SELECT id, full_name, student_id, phone, faculty, registered_at 
    FROM booth_registrations 
    ORDER BY id DESC 
    LIMIT $1 OFFSET $2;
  `;
  const res = await query(sql, [limit, offset]);
  return res.rows;
}

async function countRegistrations() {
  const res = await query(`SELECT COUNT(*) AS total FROM booth_registrations;`);
  return parseInt(res.rows[0].total, 10);
}

module.exports = {
  saveRegistration,
  getAllRegistrations,
  countRegistrations
};
