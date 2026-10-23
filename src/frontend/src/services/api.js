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
  const cleanId = String(studentId || '').trim();
  if (!cleanId) return { success: true, studentId: '', history: [] };

  try {
    const res = await fetch(`${API_URL}/api/admin/students/${encodeURIComponent(cleanId)}/history`, {
      headers: getAdminHeaders(token)
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn('API /students/:id/history fetch error, trying fallback...', err);
  }

  // Fallback: Tìm qua danh sách matches nếu endpoint riêng đang đồng bộ
  try {
    const fallbackRes = await fetch(`${API_URL}/api/admin/matches?limit=100`, {
      headers: getAdminHeaders(token)
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const matches = data.matches || [];
      const history = [];
      const idLower = cleanId.toLowerCase();

      for (const m of matches) {
        let team = null;
        let pName = cleanId;
        const pA = Array.isArray(m.team_a_players) ? m.team_a_players : [];
        const pB = Array.isArray(m.team_b_players) ? m.team_b_players : [];

        const foundA = pA.find(p => (p.studentId && p.studentId.toLowerCase() === idLower) || (typeof p === 'string' && p.toLowerCase().includes(idLower)));
        if (foundA) {
          team = 'A';
          pName = foundA.name || pName;
        } else {
          const foundB = pB.find(p => (p.studentId && p.studentId.toLowerCase() === idLower) || (typeof p === 'string' && p.toLowerCase().includes(idLower)));
          if (foundB) {
            team = 'B';
            pName = foundB.name || pName;
          }
        }

        if (team) {
          const isWin = m.winner === team;
          const isDraw = m.winner === 'DRAW';
          history.push({
            id: m.id,
            participant_id: m.id,
            match_code: m.match_code,
            room_code: m.match_code,
            student_id: cleanId,
            student_name: pName,
            team,
            result: isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSE',
            reward_claimed: false,
            score_a: m.score_a,
            score_b: m.score_b,
            winner: m.winner,
            finished_at: m.finished_at
          });
        }
      }
      return { success: true, studentId: cleanId, history };
    }
  } catch (fbErr) {
    console.error('Fallback matches history error:', fbErr);
  }

  // Trả về danh sách rỗng thay vì ném lỗi văng alert
  return { success: true, studentId: cleanId, history: [] };
}

export async function claimParticipantReward(token, participantId) {
  const cleanId = encodeURIComponent(String(participantId).trim());
  
  // Thử gửi POST trước để tránh lỗi CORS preflight với một số CDN/Proxy
  try {
    const postRes = await fetch(`${API_URL}/api/admin/participants/${cleanId}/claim`, {
      method: 'POST',
      headers: getAdminHeaders(token)
    });
    if (postRes.ok) {
      return await postRes.json();
    }
  } catch (postErr) {
    console.warn('POST claim failed, falling back to PATCH...', postErr);
  }

  // Fallback sang PATCH
  try {
    const patchRes = await fetch(`${API_URL}/api/admin/participants/${cleanId}/claim`, {
      method: 'PATCH',
      headers: getAdminHeaders(token)
    });
    if (patchRes.ok) {
      return await patchRes.json();
    }
    const errData = await patchRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || errData.message || 'Không thể xác nhận trao quà');
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Không thể kết nối đến máy chủ backend (Failed to fetch). Vui lòng thử lại sau giây lát khi backend Render hoàn tất cập nhật.');
    }
    throw err;
  }
}


