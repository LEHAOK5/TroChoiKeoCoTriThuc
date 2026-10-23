import { API_URL } from '../config/env';

export async function registerPlayer(data) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Lỗi khi đăng ký tham gia');
  }
  return json;
}

export async function quickMatch() {
  const res = await fetch(`${API_URL}/api/rooms/quick-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi ghép trận');
  return json;
}

export async function createRoom(roomCode) {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi tạo phòng');
  return json;
}

export async function getRoom(roomCode) {
  const res = await fetch(`${API_URL}/api/rooms/${roomCode}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Không tìm thấy phòng');
  return json;
}

export async function checkRoomCode(roomCode) {
  const res = await fetch(`${API_URL}/api/rooms/check/${encodeURIComponent(roomCode.trim())}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Mã phòng không tồn tại hoặc đã đóng');
  }
  return json;
}

export async function getLeaderboard() {
  const res = await fetch(`${API_URL}/api/matches/leaderboard`);
  const json = await res.json();
  return json.data || [];
}

// --- ADMIN & BTC APIS ---
function getAdminHeaders(tokenOrKey) {
  if (!tokenOrKey) return {};
  if (tokenOrKey.startsWith('ey') || tokenOrKey.length > 50) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenOrKey}`
    };
  }
  return {
    'Content-Type': 'application/json',
    'x-admin-key': tokenOrKey
  };
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Tài khoản hoặc mật khẩu không chính xác');
  }
  return json;
}

export async function adminCreateRoom(options, token) {
  const res = await fetch(`${API_URL}/api/admin/rooms/create`, {
    method: 'POST',
    headers: getAdminHeaders(token),
    body: JSON.stringify(options)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi tạo phòng');
  return json;
}

export async function adminStartMatch(roomCode, token) {
  const res = await fetch(`${API_URL}/api/admin/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: getAdminHeaders(token)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi bắt đầu trận');
  return json;
}

export async function adminResetRoom(roomCode, token) {
  const res = await fetch(`${API_URL}/api/admin/rooms/${roomCode}/reset`, {
    method: 'POST',
    headers: getAdminHeaders(token)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi làm mới phòng');
  return json;
}

export async function adminCloseRoom(roomCode, token) {
  const res = await fetch(`${API_URL}/api/admin/rooms/${roomCode}`, {
    method: 'DELETE',
    headers: getAdminHeaders(token)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Lỗi khi đóng phòng');
  return json;
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Phiên đăng nhập quản trị không hợp lệ');
  return res.json();
}

export async function getAdminRegistrations(token) {
  const res = await fetch(`${API_URL}/api/admin/registrations`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Phiên đăng nhập quản trị không hợp lệ');
  return res.json();
}

export async function getAdminRooms(token) {
  const res = await fetch(`${API_URL}/api/admin/rooms`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Phiên đăng nhập quản trị không hợp lệ');
  return res.json();
}

export async function getAdminMatches(token, limit = 100) {
  const res = await fetch(`${API_URL}/api/admin/matches?limit=${limit}`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Không thể tải lịch sử trận đấu');
  return res.json();
}

export async function getAdminStudents(token, { search = '', limit = 200, offset = 0 } = {}) {
  const query = new URLSearchParams({ search, limit, offset }).toString();
  const res = await fetch(`${API_URL}/api/admin/students?${query}`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Không thể tải danh sách sinh viên');
  return res.json();
}

export async function getStudentHistory(token, studentId) {
  const res = await fetch(`${API_URL}/api/admin/students/${encodeURIComponent(studentId)}/history`, {
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Không thể tải lịch sử đấu của sinh viên');
  return res.json();
}

export async function claimParticipantReward(token, participantId) {
  const res = await fetch(`${API_URL}/api/admin/participants/${participantId}/claim`, {
    method: 'PATCH',
    headers: getAdminHeaders(token)
  });
  if (!res.ok) throw new Error('Không thể xác nhận trao quà');
  return res.json();
}


