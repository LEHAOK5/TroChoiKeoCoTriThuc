const { query } = require('../db/pool');

async function findAdminByUsername(username) {
  const sql = `SELECT * FROM admin_users WHERE username = $1;`;
  const res = await query(sql, [username]);
  return res.rows[0] || null;
}

async function updateLastLogin(id) {
  const sql = `UPDATE admin_users SET last_login = NOW() WHERE id = $1 RETURNING id, last_login;`;
  const res = await query(sql, [id]);
  return res.rows[0];
}

async function getAllAdminUsers() {
  const sql = `SELECT id, username, full_name, role, created_at, last_login FROM admin_users ORDER BY id ASC;`;
  const res = await query(sql);
  return res.rows;
}

module.exports = {
  findAdminByUsername,
  updateLastLogin,
  getAllAdminUsers
};
