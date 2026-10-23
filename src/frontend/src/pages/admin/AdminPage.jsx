import React, { useState, useEffect, useMemo } from 'react';
import {
  adminLogin,
  getAdminStats,
  getAdminRooms,
  adminCreateRoom,
  adminStartMatch,
  adminResetRoom,
  adminCloseRoom,
  getAdminRegistrations,
  getAdminMatches,
  getAdminStudents,
  getStudentHistory,
  claimParticipantReward
} from '../../services/api';
import { socket } from '../../services/socket';
import { API_URL } from '../../config/env';

const MODES = [
  { id: '1vs1', label: '🥊 1 vs 1', desc: '1 người vs 1 người (Đủ 2 người)', max: 1 },
  { id: '2vs2', label: '👥 2 vs 2', desc: '2 người vs 2 người (Đủ 4 người)', max: 2 },
  { id: '3vs3', label: '⚡ 3 vs 3', desc: '3 người vs 3 người (Đủ 6 người)', max: 3 },
  { id: '4vs4', label: '🛡️ 4 vs 4', desc: '4 người vs 4 người (Đủ 8 người)', max: 4 },
  { id: '5vs5', label: '🔥 5 vs 5', desc: '5 người vs 5 người (Đủ 10 người)', max: 5 },
];

export default function AdminPage({ onBackToGame }) {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminUser')) || null;
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab Navigation: 'ROOMS' | 'STUDENTS' | 'MATCHES'
  const [activeTab, setActiveTab] = useState('ROOMS');

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Students & Matches Data
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PLAYING' | 'WIN' | 'LOSE' | 'NOT_PLAYED'

  // Student Match History Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Room Creation & QR State
  const [selectedMode, setSelectedMode] = useState('2vs2');
  const [customCode, setCustomCode] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [viewingQr, setViewingQr] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadRoomsOnly, 2500);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // Socket.io Realtime Listener for Admin Dashboard
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!socket.connected) {
      socket.connect();
    }

    const handleParticipantJoined = (data) => {
      console.log('⚡ [Admin Realtime] Participant Joined:', data);
      setRegistrations(prev => prev.map(s => {
        const isMatched = (data.studentId && s.student_id === data.studentId) ||
          (data.studentInfo && s.student_id === data.studentInfo.studentId);
        if (isMatched) {
          return {
            ...s,
            last_result: 'PLAYING',
            last_team: data.team,
            last_room_code: data.roomCode,
            last_match_code: data.matchCode || s.last_match_code,
            last_participant_id: data.participantId || s.last_participant_id,
            total_matches: (Number(s.total_matches) || 0) + 1,
            reward_claimed: false
          };
        }
        return s;
      }));
    };

    const handleMatchFinished = (data) => {
      console.log('🏆 [Admin Realtime] Match Finished:', data);
      // Automatically refresh students and match history
      loadRegistrations();
      loadMatches();
      loadData();
    };

    socket.on('adminParticipantJoined', handleParticipantJoined);
    socket.on('adminMatchFinished', handleMatchFinished);

    return () => {
      socket.off('adminParticipantJoined', handleParticipantJoined);
      socket.off('adminMatchFinished', handleMatchFinished);
    };
  }, [isAuthenticated, token]);

  const loadData = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        getAdminStats(token),
        getAdminRooms(token)
      ]);
      setStats(sRes.stats);
      setRooms(rRes.rooms || []);
    } catch (err) {
      console.error(err);
      if (err.message.includes('không hợp lệ')) {
        handleLogout();
      }
    }
  };

  const loadRoomsOnly = async () => {
    try {
      const rRes = await getAdminRooms(token);
      setRooms(rRes.rooms || []);
    } catch (err) {
      // silent polling error
    }
  };

  const loadRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const res = await getAdminStudents(token);
      setRegistrations(res.students || res.data || []);
    } catch (err) {
      console.error('getAdminStudents error, fallback to registrations:', err);
      try {
        const fbRes = await getAdminRegistrations(token);
        setRegistrations(fbRes.data || []);
      } catch (fbErr) {
        console.error(fbErr);
      }
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await getAdminMatches(token, 100);
      setMatches(res.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await adminLogin(username.trim(), password);
      sessionStorage.setItem('adminToken', res.token);
      sessionStorage.setItem('adminUser', JSON.stringify(res.admin));
      setToken(res.token);
      setAdminUser(res.admin);
      setSuccessMsg('Đăng nhập thành công!');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    setToken('');
    setAdminUser(null);
    setUsername('');
    setPassword('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreatingRoom(true);
    try {
      const res = await adminCreateRoom({ mode: selectedMode, customCode: customCode || null }, token);
      setSuccessMsg(`Đã tạo thành công phòng #${res.room.roomCode} (${res.room.mode})! Cung cấp mã này cho sinh viên.`);
      setCustomCode('');
      await loadRoomsOnly();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tạo phòng');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleStartMatch = async (roomCode) => {
    setActionLoading(prev => ({ ...prev, [roomCode]: true }));
    try {
      await adminStartMatch(roomCode, token);
      setSuccessMsg(`Đã phát lệnh bắt đầu trận đấu cho phòng #${roomCode}!`);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể bắt đầu trận đấu');
    } finally {
      setActionLoading(prev => ({ ...prev, [roomCode]: false }));
    }
  };

  const handleResetRoom = async (roomCode) => {
    if (!window.confirm(`Làm mới phòng #${roomCode} để đón lượt sinh viên mới? Điểm số sẽ về 0-0 và người cũ sẽ được rời phòng.`)) return;
    try {
      await adminResetRoom(roomCode, token);
      setSuccessMsg(`Đã làm mới phòng #${roomCode} để sẵn sàng đón tốp sinh viên tiếp theo!`);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể làm mới phòng');
    }
  };

  const handleCloseRoom = async (roomCode) => {
    if (!window.confirm(`Bạn có chắc muốn đóng phòng #${roomCode}?`)) return;
    try {
      await adminCloseRoom(roomCode, token);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể đóng phòng');
    }
  };

  const handleCopyLink = (roomCode) => {
    const link = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(roomCode);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadCsv = () => {
    window.open(`${API_URL}/api/admin/registrations?format=csv&token=${token}`, '_blank');
  };

  const handleClaimReward = async (participantId, studentName) => {
    if (!participantId) {
      alert('Chưa có thông tin lượt đấu để trao quà');
      return;
    }
    if (!window.confirm(`Xác nhận đã trao quà lưu niệm cho sinh viên "${studentName}"?`)) return;
    setClaimingId(participantId);
    try {
      await claimParticipantReward(token, participantId);
      setSuccessMsg(`Đã xác nhận trao quà cho sinh viên "${studentName}" thành công!`);
      // Cập nhật trạng thái ngay trong danh sách sinh viên
      setRegistrations(prev => prev.map(s => {
        if (s.last_participant_id === participantId) {
          return { ...s, reward_claimed: true, claimed_at: new Date().toISOString() };
        }
        return s;
      }));
      // Cập nhật trong popup lịch sử nếu đang mở
      setStudentHistory(prev => prev.map(h => {
        if (h.id === participantId) {
          return { ...h, reward_claimed: true, claimed_at: new Date().toISOString() };
        }
        return h;
      }));
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái trao quà');
    } finally {
      setClaimingId(null);
    }
  };

  const handleOpenStudentHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await getStudentHistory(token, student.student_id);
      setStudentHistory(res.history || []);
    } catch (err) {
      console.error(err);
      alert('Không thể tải lịch sử trận đấu của sinh viên: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Thống kê số lượng theo trạng thái
  const statusCounts = useMemo(() => {
    let playing = 0;
    let win = 0;
    let lose = 0;
    let notPlayed = 0;
    registrations.forEach(s => {
      const res = s.last_result;
      const totalMatches = Number(s.total_matches) || 0;
      if (res === 'PLAYING') playing++;
      else if (res === 'WIN') win++;
      else if (res === 'LOSE') lose++;
      else if (totalMatches === 0 || !res || res === 'NOT_PLAYED') notPlayed++;
    });
    return {
      all: registrations.length,
      playing,
      win,
      lose,
      notPlayed
    };
  }, [registrations]);

  // Filtered Students List theo tìm kiếm và trạng thái
  const filteredStudents = useMemo(() => {
    return registrations.filter(s => {
      // 1. Lọc theo trạng thái kết quả
      if (statusFilter === 'PLAYING' && s.last_result !== 'PLAYING') return false;
      if (statusFilter === 'WIN' && s.last_result !== 'WIN') return false;
      if (statusFilter === 'LOSE' && s.last_result !== 'LOSE') return false;
      if (statusFilter === 'NOT_PLAYED') {
        const total = Number(s.total_matches) || 0;
        if (s.last_result === 'PLAYING' || s.last_result === 'WIN' || s.last_result === 'LOSE' || total > 0) return false;
      }

      // 2. Tìm kiếm theo từ khóa
      if (!searchStudent.trim()) return true;
      const q = searchStudent.toLowerCase().trim();
      return (
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        (s.faculty && s.faculty.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    });
  }, [registrations, searchStudent, statusFilter]);

  return (
    <div style={{ maxWidth: 1060, margin: isMobile ? '12px auto' : '20px auto', padding: isMobile ? '0 10px' : '0 16px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
            🏛️ BẢNG ĐIỀU KHIỂN BAN TỔ CHỨC
          </h1>
          {adminUser && (
            <div style={{ fontSize: '0.82rem', color: '#1A1AFF', marginTop: 4, fontWeight: 700 }}>
              👤 Đăng nhập: <strong>{adminUser.full_name}</strong> ({adminUser.role})
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{
                background: '#FEE2E2',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 3px 0 var(--comic-black)',
                color: '#DC2626',
                padding: '8px 16px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              Đăng xuất 🚪
            </button>
          )}
          <button
            onClick={onBackToGame}
            style={{
              background: '#FFFFFF',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 3px 0 var(--comic-black)',
              color: '#0F172A',
              padding: '8px 18px',
              borderRadius: 999,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ← Quay lại Game
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        /* Login Form - 2D Neo-Brutalism High Contrast */
        <form
          onSubmit={handleLogin}
          style={{
            maxWidth: 440,
            margin: '40px auto',
            background: '#FFFFFF',
            border: '2.5px solid var(--comic-black)',
            borderRadius: 20,
            padding: '34px 28px',
            textAlign: 'center',
            boxShadow: '0 8px 0 var(--comic-black)',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: '#FEF08A',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 3px 0 var(--comic-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 16px auto'
            }}
          >
            🔐
          </div>

          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', color: '#1A1AFF', marginBottom: 22, fontWeight: 900 }}>
            ĐĂNG NHẬP BAN TỔ CHỨC
          </h2>

          {errorMsg && (
            <div style={{ background: '#FEE2E2', border: '2px solid #DC2626', color: '#B91C1C', padding: '10px 14px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, marginBottom: 18, textAlign: 'left' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block', marginBottom: 6, fontWeight: 800 }}>
              👤 TÀI KHOẢN ADMIN:
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tài khoản Admin..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#F8FAFC',
                border: '2px solid var(--comic-black)',
                borderRadius: 12,
                color: '#0F172A',
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                fontWeight: 900,
                outline: 'none',
                boxShadow: '0 2px 0 var(--comic-black)'
              }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <label style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block', marginBottom: 6, fontWeight: 800 }}>
              🔑 MẬT KHẨU:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  background: '#F8FAFC',
                  border: '2px solid var(--comic-black)',
                  borderRadius: 12,
                  color: '#0F172A',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  letterSpacing: (showPassword || !password) ? 'normal' : '3px',
                  outline: 'none',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  WebkitTextSecurity: showPassword ? 'none' : 'asterisk'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu (*)' : 'Hiện mật khẩu'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569'
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-tactile"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(180deg, #4A4AFF 0%, #1A1AFF 100%)',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 4px 0 var(--comic-black)',
              borderRadius: 14,
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 900,
              fontFamily: 'var(--font-title)',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP QUẢN TRỊ'}
          </button>
        </form>
      ) : (
        /* Authenticated Dashboard - 3 TAB NAVIGATION */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notification Messages */}
          {successMsg && (
            <div style={{ background: '#DCFCE7', border: '2px solid #16A34A', color: '#15803D', padding: '12px 16px', borderRadius: 14, fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 3px 0 var(--comic-black)' }}>
              ✅ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: '#FEE2E2', border: '2px solid #DC2626', color: '#B91C1C', padding: '12px 16px', borderRadius: 14, fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 3px 0 var(--comic-black)' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 3 TAB NAVIGATION BAR (2D COMIC BUTTONS) */}
          <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderBottom: '2.5px solid var(--comic-black)', paddingBottom: isMobile ? 8 : 12, maxWidth: '100%', boxSizing: 'border-box' }}>
            <button
              onClick={() => setActiveTab('ROOMS')}
              style={{
                flexShrink: 0,
                padding: isMobile ? '8px 12px' : '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'ROOMS' ? '#1A1AFF' : '#FFFFFF',
                color: activeTab === 'ROOMS' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'ROOMS' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'ROOMS' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🎮</span>
              <span>QUẢN LÝ PHÒNG ĐẤU</span>
              <span style={{
                background: activeTab === 'ROOMS' ? '#FFFFFF' : '#E6E6FF',
                color: activeTab === 'ROOMS' ? '#1A1AFF' : '#1010CC',
                padding: '1px 7px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('STUDENTS'); loadRegistrations(); }}
              style={{
                flexShrink: 0,
                padding: isMobile ? '8px 12px' : '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'STUDENTS' ? '#1A1AFF' : '#FFFFFF',
                color: activeTab === 'STUDENTS' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'STUDENTS' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'STUDENTS' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>📋</span>
              <span>DANH SÁCH SINH VIÊN</span>
              <span style={{
                background: activeTab === 'STUDENTS' ? '#FFFFFF' : '#FEF08A',
                color: activeTab === 'STUDENTS' ? '#1A1AFF' : '#713F12',
                padding: '1px 7px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {stats?.totalRegistrations || registrations.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('MATCHES'); loadMatches(); }}
              style={{
                flexShrink: 0,
                padding: isMobile ? '8px 12px' : '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'MATCHES' ? '#1A1AFF' : '#FFFFFF',
                color: activeTab === 'MATCHES' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: isMobile ? '0.82rem' : '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'MATCHES' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'MATCHES' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🏆</span>
              <span>LỊCH SỬ TRẬN ĐẤU</span>
              <span style={{
                background: activeTab === 'MATCHES' ? '#FFFFFF' : '#DCFCE7',
                color: activeTab === 'MATCHES' ? '#1A1AFF' : '#15803D',
                padding: '1px 7px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {stats?.totalMatches || matches.length}
              </span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: QUẢN LÝ PHÒNG ĐẤU & LIVE MATCHES                  */}
          {/* ======================================================== */}
          {activeTab === 'ROOMS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick Stats Grid (2D Neo-brutalism Cards) */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 8 : 12 }}>
                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 14, padding: isMobile ? '12px 10px' : '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#475569', fontWeight: 800 }}>👥 TỔNG ĐĂNG KÝ</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#1A1AFF', lineHeight: 1.2 }}>
                    {stats?.totalRegistrations || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>Sinh viên gian hàng</small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 14, padding: isMobile ? '12px 10px' : '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#475569', fontWeight: 800 }}>📚 CÂU HỎI</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#D97706', lineHeight: 1.2 }}>
                    {stats?.totalQuestions || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>{stats?.questionsIT || 0} IT + {stats?.questionsLAW || 0} Luật</small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 14, padding: isMobile ? '12px 10px' : '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#475569', fontWeight: 800 }}>⚔️ TRẬN ĐÃ ĐẤU</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#16A34A', lineHeight: 1.2 }}>
                    {stats?.totalMatches || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>Thắng A: <strong>{stats?.winsA || 0}</strong> | B: <strong>{stats?.winsB || 0}</strong></small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 14, padding: isMobile ? '12px 10px' : '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#475569', fontWeight: 800 }}>🚪 PHÒNG ĐANG MỞ</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#EA580C', lineHeight: 1.2 }}>
                    {rooms.length}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>Tự làm mới 2.5s</small>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadCsv}
                  style={{
                    padding: '10px 18px',
                    background: '#DCFCE7',
                    border: '2px solid var(--comic-black)',
                    boxShadow: '0 3px 0 var(--comic-black)',
                    color: '#15803D',
                    borderRadius: 12,
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  📥 Xuất Danh Sách Sinh Viên (CSV)
                </button>
                <button
                  onClick={loadData}
                  style={{
                    padding: '10px 18px',
                    background: '#FFFFFF',
                    border: '2px solid var(--comic-black)',
                    boxShadow: '0 3px 0 var(--comic-black)',
                    color: '#0F172A',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}
                >
                  Làm mới ngay 🔄
                </button>
              </div>

              {/* SECTION: TẠO PHÒNG ĐẤU MỚI (HIGH CONTRAST) */}
              <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 20, padding: 24, boxShadow: '0 6px 0 var(--comic-black)' }}>
                <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', color: '#1010CC', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>
                  <span>➕</span> TẠO PHÒNG ĐẤU MỚI CHO GIAN HÀNG
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 18, fontWeight: 600 }}>
                  Chọn chế độ phù hợp với số lượng sinh viên đang xếp hàng tại quầy. Sinh viên sẽ nhập mã phòng này để tham gia.
                </p>

                <form onSubmit={handleCreateRoom}>
                  {/* Mode Selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 10 }}>
                      CHỌN CHẾ ĐỘ THI ĐẤU:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                      {MODES.map(m => {
                        const isSelected = selectedMode === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMode(m.id)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 14,
                              cursor: 'pointer',
                              background: isSelected ? '#E6E6FF' : '#F8FAFC',
                              border: isSelected ? '2.5px solid #1A1AFF' : '2px solid #CBD5E1',
                              boxShadow: isSelected ? '0 3px 0 #1A1AFF' : '0 2px 0 rgba(0,0,0,0.06)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: isSelected ? '#1010CC' : '#0F172A', marginBottom: 4 }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: isSelected ? '#1A1AFF' : '#64748B', fontWeight: 600 }}>
                              {m.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Custom Room Code */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
                    <div style={{ flex: '1 1 240px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#0F172A', display: 'block', marginBottom: 6, fontWeight: 800 }}>
                        MÃ PHÒNG TÙY CHỌN (Để trống hệ thống tự sinh 4 số ngẫu nhiên như 8291):
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Ví dụ: 8291"
                        value={customCode}
                        onChange={e => setCustomCode(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#F8FAFC',
                          border: '2px solid var(--comic-black)',
                          borderRadius: 12,
                          color: '#0F172A',
                          fontWeight: 900,
                          fontSize: '1.1rem',
                          letterSpacing: 2,
                          outline: 'none',
                          boxShadow: '0 2px 0 var(--comic-black)'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingRoom}
                      style={{
                        padding: '13px 26px',
                        background: 'linear-gradient(180deg, #4A4AFF 0%, #1A1AFF 100%)',
                        border: '2px solid var(--comic-black)',
                        boxShadow: '0 4px 0 var(--comic-black)',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-title)',
                        borderRadius: 12,
                        cursor: creatingRoom ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {creatingRoom ? 'Đang tạo...' : 'TẠO PHÒNG ĐẤU NGAY'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION: DANH SÁCH PHÒNG ĐẤU ĐANG CHẠY */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', margin: 0, color: '#0F172A', fontWeight: 900 }}>
                    🔴 CÁC PHÒNG ĐẤU ĐANG HOẠT ĐỘNG ({rooms.length})
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                    Đồng bộ trực tiếp với màn hình sinh viên
                  </span>
                </div>

                {rooms.length === 0 ? (
                  <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: 36, textAlign: 'center', color: '#64748B', fontWeight: 700, boxShadow: '0 4px 0 var(--comic-black)' }}>
                    Chưa có phòng nào được tạo. Hãy bấm "TẠO PHÒNG ĐẤU NGAY" ở trên để mở bàn thi đấu!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {rooms.map(r => {
                      const max = r.maxPerTeam || 1;
                      const isLobby = r.state === 'LOBBY';
                      const isFinished = r.state === 'FINISHED';
                      const isPlaying = !isLobby && !isFinished;

                      const isFullTeams = r.teamACount === max && r.teamBCount === max;
                      const readyCountA = r.teamAPlayers?.filter(p => p.isReady).length || 0;
                      const readyCountB = r.teamBPlayers?.filter(p => p.isReady).length || 0;
                      const totalReady = readyCountA + readyCountB;
                      const targetTotal = max * 2;
                      const isAllReady = isFullTeams && readyCountA >= max && readyCountB >= max;
                      const canStart = isLobby && isFullTeams && isAllReady;
                      const roomJoinUrl = `${window.location.origin}/?room=${r.roomCode}`;

                      return (
                        <div
                          key={r.roomCode}
                          style={{
                            background: '#FFFFFF',
                            border: '2.5px solid var(--comic-black)',
                            borderRadius: 18,
                            padding: 20,
                            boxShadow: '0 6px 0 var(--comic-black)'
                          }}
                        >
                          {/* Top Bar of Room Card */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 14, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
                              <div style={{
                                fontFamily: 'var(--font-title)',
                                fontSize: isMobile ? '1.4rem' : '1.8rem',
                                fontWeight: 900,
                                color: '#1010CC',
                                background: '#FEF08A',
                                border: '2px solid var(--comic-black)',
                                padding: isMobile ? '2px 10px' : '4px 14px',
                                borderRadius: 12,
                                letterSpacing: 2,
                                boxShadow: '0 2px 0 var(--comic-black)'
                              }}>
                                #{r.roomCode}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                <span style={{
                                  background: '#E6E6FF',
                                  color: '#1010CC',
                                  border: '1.5px solid #C4C4FF',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}>
                                  Chế độ: {r.mode || '1vs1'} ({max} vs {max})
                                </span>
                                <span style={{
                                  background: isPlaying ? '#DCFCE7' : isFinished ? '#F1F5F9' : isAllReady ? '#DCFCE7' : isFullTeams ? '#FEF08A' : '#F1F5F9',
                                  color: isPlaying ? '#15803D' : isFinished ? '#475569' : isAllReady ? '#15803D' : isFullTeams ? '#854D0E' : '#64748B',
                                  border: '1.5px solid var(--comic-black)',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontSize: '0.78rem',
                                  fontWeight: 800
                                }}>
                                  {isPlaying
                                    ? `⚡ ĐANG ĐẤU (Câu ${r.roundCount} | ${r.scoreA}-${r.scoreB})`
                                    : isFinished
                                    ? '🏆 ĐÃ KẾT THÚC'
                                    : isAllReady
                                    ? `✨ ĐỦ ${targetTotal}/${targetTotal} NGƯỜI SẴN SÀNG`
                                    : isFullTeams
                                    ? `⏳ ĐỢI SẴN SÀNG (${totalReady}/${targetTotal})`
                                    : `⏳ ĐỢI NGƯỜI (ĐÃ CÓ ${r.teamACount + r.teamBCount}/${targetTotal})`}
                                </span>
                              </div>
                            </div>

                            {/* Control Actions */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* QR Code toggle */}
                              <button
                                onClick={() => setViewingQr(viewingQr === r.roomCode ? null : r.roomCode)}
                                style={{
                                  background: viewingQr === r.roomCode ? '#FEF08A' : '#FFFFFF',
                                  border: '2px solid var(--comic-black)',
                                  boxShadow: '0 2px 0 var(--comic-black)',
                                  color: '#0F172A',
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}
                              >
                                📱 {viewingQr === r.roomCode ? 'Đóng QR' : 'Mã QR quét'}
                              </button>

                              {/* Start Match button */}
                              {isLobby && (
                                <button
                                  onClick={() => handleStartMatch(r.roomCode)}
                                  disabled={!canStart || actionLoading[r.roomCode]}
                                  style={{
                                    padding: '8px 16px',
                                    background: !canStart ? '#F1F5F9' : '#22C55E',
                                    border: '2px solid var(--comic-black)',
                                    boxShadow: canStart ? '0 3px 0 var(--comic-black)' : 'none',
                                    color: !canStart ? '#94A3B8' : '#FFFFFF',
                                    fontSize: '0.85rem',
                                    fontWeight: 900,
                                    borderRadius: 10,
                                    cursor: canStart ? 'pointer' : 'not-allowed'
                                  }}
                                >
                                  {actionLoading[r.roomCode]
                                    ? 'Đang gửi lệnh...'
                                    : !isFullTeams
                                    ? `⏳ Đợi đủ người (${r.teamACount + r.teamBCount}/${targetTotal})`
                                    : !isAllReady
                                    ? `⏳ Đợi sẵn sàng (${totalReady}/${targetTotal})`
                                    : 'BẮT ĐẦU TRẬN ĐẤU NGAY'}
                                </button>
                              )}

                              {/* Reset Room button */}
                              <button
                                onClick={() => handleResetRoom(r.roomCode)}
                                style={{
                                  background: '#FEF08A',
                                  border: '2px solid var(--comic-black)',
                                  boxShadow: '0 2px 0 var(--comic-black)',
                                  color: '#713F12',
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}
                              >
                                🔄 Đón lượt mới
                              </button>

                              {/* Close room */}
                              <button
                                onClick={() => handleCloseRoom(r.roomCode)}
                                style={{
                                  background: '#FEE2E2',
                                  border: '2px solid var(--comic-black)',
                                  boxShadow: '0 2px 0 var(--comic-black)',
                                  color: '#DC2626',
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}
                              >
                                Đóng ❌
                              </button>
                            </div>
                          </div>

                          {/* Expandable QR Code Scanner Card */}
                          {viewingQr === r.roomCode && (
                            <div style={{
                              background: '#F8FAFC',
                              border: '2px solid var(--comic-black)',
                              borderRadius: 14,
                              padding: 16,
                              marginBottom: 14,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 20,
                              flexWrap: 'wrap'
                            }}>
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(roomJoinUrl)}`}
                                alt={`QR Phòng ${r.roomCode}`}
                                style={{ width: 130, height: 130, borderRadius: 10, background: '#FFF', padding: 6, border: '2px solid var(--comic-black)' }}
                              />
                              <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1010CC', marginBottom: 4 }}>
                                  📲 MÃ QR VÀO PHÒNG #{r.roomCode}
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: 10, fontWeight: 600 }}>
                                  Cho sinh viên dùng camera điện thoại quét mã QR này để tự động điền sẵn mã phòng, chỉ cần nhập Tên và MSSV là vào đấu ngay!
                                </p>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    readOnly
                                    value={roomJoinUrl}
                                    style={{
                                      flex: 1,
                                      padding: '8px 10px',
                                      background: '#FFFFFF',
                                      border: '1.5px solid var(--comic-black)',
                                      borderRadius: 8,
                                      color: '#0F172A',
                                      fontSize: '0.82rem',
                                      fontWeight: 700
                                    }}
                                  />
                                  <button
                                    onClick={() => handleCopyLink(r.roomCode)}
                                    style={{
                                      padding: '8px 14px',
                                      background: copiedLink === r.roomCode ? '#DCFCE7' : '#FFFFFF',
                                      border: '1.5px solid var(--comic-black)',
                                      color: copiedLink === r.roomCode ? '#15803D' : '#0F172A',
                                      borderRadius: 8,
                                      fontSize: '0.8rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {copiedLink === r.roomCode ? 'Đã sao chép ✅' : 'Sao chép link 📋'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Teams Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                            {/* Team A */}
                            <div style={{ background: '#F3F3FF', border: '2px solid #C4C4FF', borderRadius: 14, padding: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontWeight: 900, color: '#1A1AFF', fontSize: '0.92rem' }}>
                                  ⚡ ĐỘI A (TIA CHỚP)
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.teamACount >= max ? '#16A34A' : '#1A1AFF' }}>
                                  {r.teamACount} / {max} người
                                </span>
                              </div>
                              {(!r.teamAPlayers || r.teamAPlayers.length === 0) ? (
                                <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                                  Chưa có sinh viên nào vào Đội A...
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {r.teamAPlayers.map((p, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #C4C4FF', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                                      <span style={{ color: '#0F172A' }}>👤 <strong>{p.name}</strong> <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({p.studentId})</span></span>
                                      <span style={{ color: p.isReady ? '#16A34A' : '#D97706', fontWeight: 800, fontSize: '0.75rem' }}>
                                        {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Team B */}
                            <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: 14, padding: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontWeight: 900, color: '#EA580C', fontSize: '0.92rem' }}>
                                  🔥 ĐỘI B (NGỌN LỬA)
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.teamBCount >= max ? '#16A34A' : '#C2410C' }}>
                                  {r.teamBCount} / {max} người
                                </span>
                              </div>
                              {(!r.teamBPlayers || r.teamBPlayers.length === 0) ? (
                                <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                                  Chưa có sinh viên nào vào Đội B...
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {r.teamBPlayers.map((p, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #FED7AA', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                                      <span style={{ color: '#0F172A' }}>👤 <strong>{p.name}</strong> <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({p.studentId})</span></span>
                                      <span style={{ color: p.isReady ? '#16A34A' : '#D97706', fontWeight: 800, fontSize: '0.75rem' }}>
                                        {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DANH SÁCH SINH VIÊN & KẾT QUẢ THI ĐẤU             */}
          {/* ======================================================== */}
          {activeTab === 'STUDENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Search & Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={e => setSearchStudent(e.target.value)}
                    placeholder="🔍 Tìm nhanh theo Tên, MSSV, Khoa, SĐT..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: '2px solid var(--comic-black)',
                      borderRadius: 14,
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxShadow: '0 2px 0 var(--comic-black)'
                    }}
                  />
                  {searchStudent && (
                    <button
                      onClick={() => setSearchStudent('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        color: '#64748B'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={loadRegistrations}
                    disabled={loadingRegistrations}
                    style={{
                      padding: '10px 16px',
                      background: '#FFFFFF',
                      border: '2px solid var(--comic-black)',
                      boxShadow: '0 3px 0 var(--comic-black)',
                      color: '#0F172A',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    {loadingRegistrations ? 'Đang tải...' : 'Làm mới 🔄'}
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    style={{
                      padding: '10px 18px',
                      background: '#DCFCE7',
                      border: '2px solid var(--comic-black)',
                      boxShadow: '0 3px 0 var(--comic-black)',
                      color: '#15803D',
                      borderRadius: 12,
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📥 Xuất Excel/CSV (Kèm Kết Quả)
                  </button>
                </div>
              </div>

              {/* Status Filter Badges (2D Comic Pills) */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginRight: 4 }}>
                  Lọc trạng thái:
                </span>

                <button
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '2px solid var(--comic-black)',
                    background: statusFilter === 'ALL' ? '#0F172A' : '#FFFFFF',
                    color: statusFilter === 'ALL' ? '#FFFFFF' : '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'ALL' ? '0 3px 0 var(--comic-black)' : '0 1px 0 var(--comic-black)'
                  }}
                >
                  Tất cả ({statusCounts.all})
                </button>

                <button
                  onClick={() => setStatusFilter('PLAYING')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '2px solid var(--comic-black)',
                    background: statusFilter === 'PLAYING' ? '#FEF08A' : '#FFFFFF',
                    color: statusFilter === 'PLAYING' ? '#713F12' : '#854D0E',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'PLAYING' ? '0 3px 0 var(--comic-black)' : '0 1px 0 var(--comic-black)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#EAB308',
                    display: 'inline-block',
                    animation: statusCounts.playing > 0 ? 'pulse 1.2s infinite' : 'none'
                  }} />
                  ⏳ Đang đấu ({statusCounts.playing})
                </button>

                <button
                  onClick={() => setStatusFilter('WIN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '2px solid var(--comic-black)',
                    background: statusFilter === 'WIN' ? '#DCFCE7' : '#FFFFFF',
                    color: statusFilter === 'WIN' ? '#15803D' : '#166534',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'WIN' ? '0 3px 0 var(--comic-black)' : '0 1px 0 var(--comic-black)'
                  }}
                >
                  🏆 Chiến thắng ({statusCounts.win})
                </button>

                <button
                  onClick={() => setStatusFilter('LOSE')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '2px solid var(--comic-black)',
                    background: statusFilter === 'LOSE' ? '#FFEDD5' : '#FFFFFF',
                    color: statusFilter === 'LOSE' ? '#C2410C' : '#9A3412',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'LOSE' ? '0 3px 0 var(--comic-black)' : '0 1px 0 var(--comic-black)'
                  }}
                >
                  👮 Bị bắt tù ({statusCounts.lose})
                </button>

                <button
                  onClick={() => setStatusFilter('NOT_PLAYED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '2px solid var(--comic-black)',
                    background: statusFilter === 'NOT_PLAYED' ? '#F1F5F9' : '#FFFFFF',
                    color: statusFilter === 'NOT_PLAYED' ? '#334155' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'NOT_PLAYED' ? '0 3px 0 var(--comic-black)' : '0 1px 0 var(--comic-black)'
                  }}
                >
                  ⚪ Chưa thi đấu ({statusCounts.notPlayed})
                </button>
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                <span>
                  Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{registrations.length}</strong> sinh viên
                </span>
                {searchStudent && (
                  <span style={{ color: '#1A1AFF' }}>
                    Bộ lọc: "{searchStudent}"
                  </span>
                )}
              </div>

              {/* Students Data Table (2D Neo-brutalism Table with Match Result) */}
              <div style={{
                background: '#FFFFFF',
                border: '2.5px solid var(--comic-black)',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 6px 0 var(--comic-black)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--comic-black)' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A', width: 45 }}>STT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>SINH VIÊN & MSSV</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>KHOA / NGÀNH</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>TRẠNG THÁI HIỆN TẠI</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>THỐNG KÊ TRẬN</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A', textAlign: 'center' }}>TRAO QUÀ</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A', textAlign: 'center' }}>CHI TIẾT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRegistrations ? (
                        <tr>
                          <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Đang tải danh sách sinh viên & kết quả trận đấu...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            {searchStudent ? 'Không tìm thấy sinh viên nào khớp với từ khóa tìm kiếm.' : 'Chưa có sinh viên nào trong danh mục này.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => {
                          const totalMatches = Number(s.total_matches) || 0;
                          const wins = Number(s.total_wins) || 0;
                          const losses = Number(s.total_losses) || 0;
                          const isPlaying = s.last_result === 'PLAYING';
                          const isWin = s.last_result === 'WIN';
                          const isLose = s.last_result === 'LOSE';
                          const isClaimed = Boolean(s.reward_claimed);

                          return (
                            <tr
                              key={s.id || s.student_id || idx}
                              style={{
                                borderBottom: '1px solid #E2E8F0',
                                background: isPlaying ? '#FEFCE8' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'),
                                transition: 'background 0.15s ease'
                              }}
                            >
                              {/* STT */}
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: '#64748B' }}>
                                #{idx + 1}
                              </td>

                              {/* Họ tên & MSSV */}
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: '0.94rem' }}>
                                    <span>👤</span>
                                    <span>{s.full_name}</span>
                                  </span>
                                  <span style={{ display: 'inline-flex', width: 'fit-content', background: '#E6E6FF', color: '#1010CC', padding: '1px 7px', borderRadius: 6, border: '1px solid #C4C4FF', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {s.student_id}
                                  </span>
                                </div>
                              </td>

                              {/* Khoa & SĐT */}
                              <td style={{ padding: '12px 14px', color: '#334155' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.faculty || 'ĐH Văn Hiến'}</div>
                                <div style={{ color: '#64748B', fontSize: '0.78rem', fontFamily: 'monospace', marginTop: 2 }}>
                                  📞 {s.phone || '---'}
                                </div>
                              </td>

                              {/* Trạng thái hiện tại (Realtime Badges) */}
                              <td style={{ padding: '12px 14px' }}>
                                {isPlaying ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                                    <span style={{
                                      background: '#FEF08A',
                                      color: '#713F12',
                                      border: '1.5px solid #EAB308',
                                      padding: '3px 9px',
                                      borderRadius: 999,
                                      fontWeight: 900,
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5
                                    }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CA8A04' }} />
                                      ⏳ ĐANG THI ĐẤU
                                    </span>
                                    <span style={{ fontSize: '0.73rem', color: '#854D0E', fontWeight: 700 }}>
                                      Phòng #{s.last_room_code || '---'} ({s.last_team === 'A' ? '⚡ Đội A' : '🔥 Đội B'})
                                    </span>
                                  </div>
                                ) : isWin ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                                    <span style={{
                                      background: '#DCFCE7',
                                      color: '#15803D',
                                      border: '1.5px solid #16A34A',
                                      padding: '3px 10px',
                                      borderRadius: 999,
                                      fontWeight: 900,
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5
                                    }}>
                                      🏆 CHIẾN THẮNG
                                    </span>
                                    {s.last_room_code && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                        Phòng #{s.last_room_code} ({s.last_team === 'A' ? '⚡ Đội A' : '🔥 Đội B'})
                                      </span>
                                    )}
                                  </div>
                                ) : isLose ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                                    <span style={{
                                      background: '#FFEDD5',
                                      color: '#C2410C',
                                      border: '1.5px solid #EA580C',
                                      padding: '3px 10px',
                                      borderRadius: 999,
                                      fontWeight: 900,
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5
                                    }}>
                                      👮 BỊ BẮT TÙ
                                    </span>
                                    {s.last_room_code && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                        Phòng #{s.last_room_code} ({s.last_team === 'A' ? '⚡ Đội A' : '🔥 Đội B'})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{
                                    background: '#F1F5F9',
                                    color: '#64748B',
                                    border: '1px solid #CBD5E1',
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                  }}>
                                    ⚪ Chưa thi đấu
                                  </span>
                                )}
                              </td>

                              {/* Thống kê trận */}
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>
                                  {totalMatches > 0 ? `${totalMatches} trận` : '0 trận'}
                                </div>
                                {totalMatches > 0 && (
                                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginTop: 2 }}>
                                    <span style={{ color: '#16A34A' }}>{wins}W</span> - <span style={{ color: '#DC2626' }}>{losses}L</span>
                                  </div>
                                )}
                              </td>

                              {/* Trao quà lưu niệm */}
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                {isClaimed ? (
                                  <span style={{
                                    background: '#DCFCE7',
                                    color: '#15803D',
                                    border: '1.5px solid #16A34A',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    display: 'inline-block'
                                  }}>
                                    ✅ ĐÃ NHẬN
                                  </span>
                                ) : (s.last_participant_id && (isWin || isLose || totalMatches > 0)) ? (
                                  <button
                                    onClick={() => handleClaimReward(s.last_participant_id, s.full_name)}
                                    disabled={claimingId === s.last_participant_id}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#FEF08A',
                                      border: '2px solid var(--comic-black)',
                                      boxShadow: '0 2px 0 var(--comic-black)',
                                      color: '#713F12',
                                      borderRadius: 10,
                                      fontWeight: 900,
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {claimingId === s.last_participant_id ? 'Đang lưu...' : '🎁 Trao quà'}
                                  </button>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>---</span>
                                )}
                              </td>

                              {/* Thao tác Chi tiết */}
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleOpenStudentHistory(s)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#FFFFFF',
                                    border: '2px solid var(--comic-black)',
                                    boxShadow: '0 2px 0 var(--comic-black)',
                                    color: '#1010CC',
                                    borderRadius: 10,
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  📜 Lịch sử
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: LỊCH SỬ CÁC TRẬN ĐẤU (MATCH HISTORY)               */}
          {/* ======================================================== */}
          {activeTab === 'MATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Win/Loss Ratio */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div style={{ background: '#F3F3FF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#1010CC', fontWeight: 900 }}>⚡ ĐỘI A THẮNG (TIA CHỚP)</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.4rem', fontWeight: 900, color: '#1A1AFF' }}>
                    {stats?.winsA || 0} trận
                  </div>
                  <small style={{ color: '#1010CC', fontWeight: 700 }}>
                    Chiếm {stats?.totalMatches ? Math.round(((stats.winsA || 0) / stats.totalMatches) * 100) : 0}% tổng trận
                  </small>
                </div>

                <div style={{ background: '#FFF7ED', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#C2410C', fontWeight: 900 }}>🔥 ĐỘI B THẮNG (NGỌN LỬA)</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.4rem', fontWeight: 900, color: '#EA580C' }}>
                    {stats?.winsB || 0} trận
                  </div>
                  <small style={{ color: '#C2410C', fontWeight: 700 }}>
                    Chiếm {stats?.totalMatches ? Math.round(((stats.winsB || 0) / stats.totalMatches) * 100) : 0}% tổng trận
                  </small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 900 }}>🏆 TỔNG SỐ TRẬN HOÀN THÀNH</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.4rem', fontWeight: 900, color: '#16A34A' }}>
                    {stats?.totalMatches || matches.length}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 700 }}>Ghi nhận tự động từ Supabase</small>
                </div>
              </div>

              {/* Refresh Match list */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 800 }}>
                  Danh sách {matches.length} trận đấu gần đây nhất:
                </span>
                <button
                  onClick={loadMatches}
                  disabled={loadingMatches}
                  style={{
                    padding: '8px 16px',
                    background: '#FFFFFF',
                    border: '2px solid var(--comic-black)',
                    boxShadow: '0 2px 0 var(--comic-black)',
                    color: '#0F172A',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}
                >
                  {loadingMatches ? 'Đang tải...' : 'Làm mới 🔄'}
                </button>
              </div>

              {/* Match Records Table */}
              <div style={{
                background: '#FFFFFF',
                border: '2.5px solid var(--comic-black)',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 6px 0 var(--comic-black)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--comic-black)' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A', width: 60 }}>STT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>MÃ TRẬN</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>TỈ SỐ CHUNG CUỘC</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>ĐỘI CHIẾN THẮNG</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>SỐ CÂU HỎI</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>THỜI GIAN KẾT THÚC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMatches ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Đang tải lịch sử các trận đấu...
                          </td>
                        </tr>
                      ) : matches.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Chưa có dữ liệu trận đấu nào được lưu lại.
                          </td>
                        </tr>
                      ) : (
                        matches.map((m, idx) => (
                          <tr
                            key={m.id || idx}
                            style={{
                              borderBottom: '1px solid #E2E8F0',
                              background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                            }}
                          >
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#64748B' }}>
                              #{idx + 1}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 900, color: '#1010CC' }}>
                              <span style={{ background: '#FEF08A', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--comic-black)', fontSize: '0.8rem' }}>
                                #{m.match_code || m.room_code || 'MATCH'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 900, fontSize: '1.05rem' }}>
                              <span style={{ color: '#1A1AFF' }}>{m.score_a ?? 0}</span>
                              <span style={{ color: '#64748B', margin: '0 6px' }}>-</span>
                              <span style={{ color: '#EA580C' }}>{m.score_b ?? 0}</span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {m.winner === 'A' ? (
                                <span style={{ background: '#E6E6FF', color: '#1010CC', border: '1.5px solid #1A1AFF', padding: '3px 10px', borderRadius: 999, fontWeight: 900, fontSize: '0.78rem' }}>
                                  ⚡ ĐỘI A VÔ ĐỊCH
                                </span>
                              ) : m.winner === 'B' ? (
                                <span style={{ background: '#FFEDD5', color: '#C2410C', border: '1.5px solid #EA580C', padding: '3px 10px', borderRadius: 999, fontWeight: 900, fontSize: '0.78rem' }}>
                                  🔥 ĐỘI B VÔ ĐỊCH
                                </span>
                              ) : (
                                <span style={{ background: '#F1F5F9', color: '#64748B', border: '1.5px solid #CBD5E1', padding: '3px 10px', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem' }}>
                                  🤝 HÒA NHAU
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: 700 }}>
                              {m.total_questions || 10} câu
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>
                              {m.finished_at ? new Date(m.finished_at).toLocaleString('vi-VN') : '---'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* POPUP MODAL: LỊCH SỬ THI ĐẤU SINH VIÊN                   */}
      {/* ======================================================== */}
      {historyModalOpen && selectedStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryModalOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 10 : 20
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '3px solid var(--comic-black)',
              borderRadius: 20,
              boxShadow: '0 8px 0 var(--comic-black)',
              maxWidth: 780,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: '#1A1AFF',
              color: '#FFFFFF',
              padding: isMobile ? '14px 16px' : '18px 24px',
              borderBottom: '3px solid var(--comic-black)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                  📜 LỊCH SỬ THI ĐẤU & TRAO QUÀ
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#FEF08A', fontWeight: 800, marginTop: 4 }}>
                  Sinh viên: {selectedStudent.full_name} ({selectedStudent.student_id}) - {selectedStudent.faculty || 'ĐH Văn Hiến'}
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                style={{
                  background: '#FFFFFF',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0F172A'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: isMobile ? 14 : 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick Summary Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div style={{ background: '#F8FAFC', border: '2px solid var(--comic-black)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>TỔNG SỐ TRẬN</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{studentHistory.length}</div>
                </div>
                <div style={{ background: '#DCFCE7', border: '2px solid var(--comic-black)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>CHIẾN THẮNG</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803D' }}>
                    {studentHistory.filter(h => h.result === 'WIN').length}
                  </div>
                </div>
                <div style={{ background: '#FFEDD5', border: '2px solid var(--comic-black)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9A3412' }}>BỊ BẮT TÙ</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#C2410C' }}>
                    {studentHistory.filter(h => h.result === 'LOSE').length}
                  </div>
                </div>
                <div style={{ background: '#FEF08A', border: '2px solid var(--comic-black)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#854D0E' }}>TỈ LỆ THẮNG</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#713F12' }}>
                    {studentHistory.length > 0
                      ? `${Math.round((studentHistory.filter(h => h.result === 'WIN').length / studentHistory.length) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div style={{
                background: '#FFFFFF',
                border: '2px solid var(--comic-black)',
                borderRadius: 14,
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--comic-black)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>MÃ TRẬN / PHÒNG</th>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>ĐỘI</th>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>TỈ SỐ (A - B)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>KẾT QUẢ</th>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A' }}>THỜI GIAN</th>
                        <th style={{ padding: '10px 12px', fontWeight: 900, color: '#0F172A', textAlign: 'center' }}>TRAO QUÀ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingHistory ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Đang tải lịch sử thi đấu của sinh viên...
                          </td>
                        </tr>
                      ) : studentHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Sinh viên này chưa tham gia trận kéo co nào.
                          </td>
                        </tr>
                      ) : (
                        studentHistory.map((h, hIdx) => {
                          const isWin = h.result === 'WIN';
                          const isPlaying = h.result === 'PLAYING';
                          const isClaimed = Boolean(h.reward_claimed);

                          return (
                            <tr
                              key={h.id || hIdx}
                              style={{
                                borderBottom: '1px solid #E2E8F0',
                                background: isPlaying ? '#FEFCE8' : (hIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC')
                              }}
                            >
                              <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                                <span style={{ background: '#FEF08A', padding: '2px 7px', borderRadius: 6, border: '1px solid var(--comic-black)', fontSize: '0.78rem' }}>
                                  #{h.match_code || h.room_code || 'MATCH'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                                {h.team === 'A' ? (
                                  <span style={{ color: '#1A1AFF' }}>⚡ Đội A</span>
                                ) : (
                                  <span style={{ color: '#EA580C' }}>🔥 Đội B</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 900 }}>
                                {h.score_a != null ? `${h.score_a} - ${h.score_b}` : '---'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {isPlaying ? (
                                  <span style={{ background: '#FEF08A', color: '#713F12', border: '1px solid #EAB308', padding: '2px 8px', borderRadius: 999, fontWeight: 900, fontSize: '0.75rem' }}>
                                    ⏳ Đang đấu
                                  </span>
                                ) : isWin ? (
                                  <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #16A34A', padding: '2px 8px', borderRadius: 999, fontWeight: 900, fontSize: '0.75rem' }}>
                                    🏆 Thắng
                                  </span>
                                ) : (
                                  <span style={{ background: '#FFEDD5', color: '#C2410C', border: '1px solid #EA580C', padding: '2px 8px', borderRadius: 999, fontWeight: 900, fontSize: '0.75rem' }}>
                                    👮 Bị bắt tù
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#64748B', fontSize: '0.78rem' }}>
                                {h.finished_at ? new Date(h.finished_at).toLocaleTimeString('vi-VN') : '---'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                {isClaimed ? (
                                  <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #16A34A', padding: '2px 8px', borderRadius: 999, fontWeight: 800, fontSize: '0.75rem' }}>
                                    ✅ ĐÃ NHẬN
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleClaimReward(h.id, selectedStudent.full_name)}
                                    disabled={claimingId === h.id}
                                    style={{
                                      background: '#FEF08A',
                                      color: '#713F12',
                                      border: '1.5px solid var(--comic-black)',
                                      boxShadow: '0 2px 0 var(--comic-black)',
                                      borderRadius: 8,
                                      padding: '3px 9px',
                                      fontSize: '0.75rem',
                                      fontWeight: 900,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {claimingId === h.id ? 'Đang lưu...' : '🎁 Trao quà'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '2px solid var(--comic-black)',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setHistoryModalOpen(false)}
                style={{
                  background: '#FFFFFF',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  color: '#0F172A',
                  padding: '8px 20px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '0.85rem'
                }}
              >
                Đóng ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
