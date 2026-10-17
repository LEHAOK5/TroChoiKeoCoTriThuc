const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const config = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) 
    : ['http://localhost:5173', 'https://keoco.vercel.app'],
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres.jtxbabtgzjyqqvaibdks:lenhuthao2005tg@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'keoco_admin_secret_2026',
  SESSION_SECRET: process.env.SESSION_SECRET || 'keoco_session_super_secret_jwt_key_2026',
  
  // Game Rules & Timers
  WIN_SCORE: parseInt(process.env.WIN_SCORE, 10) || 10,
  BUZZ_TIMEOUT_SEC: parseInt(process.env.BUZZ_TIMEOUT_SEC, 10) || 15,
  ANSWER_TIMEOUT_SEC: parseInt(process.env.ANSWER_TIMEOUT_SEC, 10) || 10,
  REBOUND_TIMEOUT_SEC: parseInt(process.env.REBOUND_TIMEOUT_SEC, 10) || 8,
  MAX_PLAYERS_PER_TEAM: parseInt(process.env.MAX_PLAYERS_PER_TEAM, 10) || 5,
  MATCH_TIME_LIMIT_SEC: parseInt(process.env.MATCH_TIME_LIMIT_SEC, 10) || 600,
  RECONNECT_GRACE_SEC: parseInt(process.env.RECONNECT_GRACE_SEC, 10) || 30
};

module.exports = config;
