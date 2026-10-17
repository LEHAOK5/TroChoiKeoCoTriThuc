const { query } = require('../src/db/pool');
const bcrypt = require('bcryptjs');

async function initAdmin() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'SUPER_ADMIN',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );
  `);
  console.log('Created admin_users table');

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('lenhuthao2005tg', salt);

  const res = await query(`
    INSERT INTO admin_users (username, password_hash, full_name, role)
    VALUES ('admin', $1, 'Ban Tổ Chức', 'SUPER_ADMIN')
    ON CONFLICT (username) DO UPDATE 
    SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name
    RETURNING id, username, full_name, role;
  `, [hash]);

  console.log('Seeded Admin Account:', res.rows[0]);
  process.exit(0);
}

initAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
