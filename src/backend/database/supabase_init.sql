-- =========================================
-- SQL Script: Khởi tạo CSDL Kéo Co Tri Thức
-- Supabase: jtxbabtgzjyqqvaibdks
-- =========================================

-- 1. Bảng ngân hàng câu hỏi (600 câu: 300 IT + 300 Luật)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('IT', 'LAW')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,           -- ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"]
  answer_index INTEGER NOT NULL CHECK (answer_index >= 0 AND answer_index <= 3),
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng đăng ký sinh viên tham gia gian hàng
CREATE TABLE IF NOT EXISTS booth_registrations (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,          -- MSSV
  phone TEXT DEFAULT '',
  faculty TEXT DEFAULT '',           -- Khoa
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng lịch sử kết quả ván đấu
CREATE TABLE IF NOT EXISTS match_history (
  id SERIAL PRIMARY KEY,
  match_code TEXT NOT NULL UNIQUE,   -- Mã trận (ví dụ: "MATCH-20261017-001")
  team_a_name TEXT DEFAULT 'Đội A',
  team_b_name TEXT DEFAULT 'Đội B',
  team_a_players JSONB DEFAULT '[]', -- Danh sách MSSV đội A
  team_b_players JSONB DEFAULT '[]', -- Danh sách MSSV đội B
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  winner TEXT CHECK (winner IN ('A', 'B', 'DRAW')),
  total_questions INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_booth_registrations_student_id ON booth_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_match_history_match_code ON match_history(match_code);

-- Bật Row Level Security (RLS) - cho phép anonymous read
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read questions" ON questions FOR SELECT USING (true);

ALTER TABLE booth_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert registrations" ON booth_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read registrations" ON booth_registrations FOR SELECT USING (true);

ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert match_history" ON match_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read match_history" ON match_history FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update match_history" ON match_history FOR UPDATE USING (true);

-- 4. Bảng tài khoản Quản trị viên / Ban tổ chức
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'SUPER_ADMIN', -- 'SUPER_ADMIN' hoặc 'BOOTH_STAFF'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read admin_users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert admin_users" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update admin_users" ON admin_users FOR UPDATE USING (true);

-- 5. Bảng chi tiết kết quả từng sinh viên tham gia từng ván đấu
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

ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read match_participants" ON match_participants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert match_participants" ON match_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update match_participants" ON match_participants FOR UPDATE USING (true);

