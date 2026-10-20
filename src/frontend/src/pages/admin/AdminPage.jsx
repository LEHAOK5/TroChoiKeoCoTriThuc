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
  getAdminMatches
} from '../../services/api';
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

  // Students & Matches Data
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

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
      const res = await getAdminRegistrations(token);
      setRegistrations(res.data || []);
    } catch (err) {
      console.error(err);
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

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return registrations;
    const q = searchStudent.toLowerCase().trim();
    return registrations.filter(s =>
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.faculty && s.faculty.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [registrations, searchStudent]);

  return (
    <div style={{ maxWidth: 1060, margin: '20px auto', padding: '0 16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
            🏛️ BẢNG ĐIỀU KHIỂN BAN TỔ CHỨC
          </h1>
          {adminUser && (
            <div style={{ fontSize: '0.85rem', color: '#0369A1', marginTop: 4, fontWeight: 700 }}>
              👤 Đăng nhập: <strong>{adminUser.full_name}</strong> ({adminUser.role})
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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

          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', color: '#1E3A8A', marginBottom: 22, fontWeight: 900 }}>
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
              background: 'linear-gradient(180deg, #0284C7 0%, #0369A1 100%)',
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '2.5px solid var(--comic-black)', paddingBottom: 14 }}>
            <button
              onClick={() => setActiveTab('ROOMS')}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'ROOMS' ? '#0284C7' : '#FFFFFF',
                color: activeTab === 'ROOMS' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'ROOMS' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'ROOMS' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>🎮</span>
              <span>QUẢN LÝ PHÒNG ĐẤU</span>
              <span style={{
                background: activeTab === 'ROOMS' ? '#FFFFFF' : '#E0F2FE',
                color: activeTab === 'ROOMS' ? '#0284C7' : '#0369A1',
                padding: '1px 8px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('STUDENTS'); loadRegistrations(); }}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'STUDENTS' ? '#0284C7' : '#FFFFFF',
                color: activeTab === 'STUDENTS' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'STUDENTS' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'STUDENTS' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>📋</span>
              <span>DANH SÁCH SINH VIÊN</span>
              <span style={{
                background: activeTab === 'STUDENTS' ? '#FFFFFF' : '#FEF08A',
                color: activeTab === 'STUDENTS' ? '#0284C7' : '#713F12',
                padding: '1px 8px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                {stats?.totalRegistrations || registrations.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('MATCHES'); loadMatches(); }}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '2px solid var(--comic-black)',
                background: activeTab === 'MATCHES' ? '#0284C7' : '#FFFFFF',
                color: activeTab === 'MATCHES' ? '#FFFFFF' : '#0F172A',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'MATCHES' ? '0 4px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                transform: activeTab === 'MATCHES' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>🏆</span>
              <span>LỊCH SỬ TRẬN ĐẤU</span>
              <span style={{
                background: activeTab === 'MATCHES' ? '#FFFFFF' : '#DCFCE7',
                color: activeTab === 'MATCHES' ? '#0284C7' : '#15803D',
                padding: '1px 8px',
                borderRadius: 999,
                fontSize: '0.75rem',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Quick Stats Grid (2D Neo-brutalism Cards) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>👥 TỔNG ĐĂNG KÝ</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 900, color: '#0284C7', lineHeight: 1.2 }}>
                    {stats?.totalRegistrations || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600 }}>Sinh viên tại gian hàng</small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>📚 NGÂN HÀNG CÂU HỎI</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 900, color: '#D97706', lineHeight: 1.2 }}>
                    {stats?.totalQuestions || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600 }}>{stats?.questionsIT || 0} IT + {stats?.questionsLAW || 0} Luật</small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>⚔️ TRẬN ĐÃ ĐẤU</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 900, color: '#16A34A', lineHeight: 1.2 }}>
                    {stats?.totalMatches || 0}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600 }}>Thắng A: <strong>{stats?.winsA || 0}</strong> | Thắng B: <strong>{stats?.winsB || 0}</strong></small>
                </div>

                <div style={{ background: '#FFFFFF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800 }}>🚪 PHÒNG ĐANG MỞ</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 900, color: '#EA580C', lineHeight: 1.2 }}>
                    {rooms.length}
                  </div>
                  <small style={{ color: '#64748B', fontWeight: 600 }}>Tự động làm mới 2.5s</small>
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
                <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', color: '#1E3A8A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>
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
                              background: isSelected ? '#E0F2FE' : '#F8FAFC',
                              border: isSelected ? '2.5px solid #0284C7' : '2px solid #CBD5E1',
                              boxShadow: isSelected ? '0 3px 0 #0284C7' : '0 2px 0 rgba(0,0,0,0.06)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: isSelected ? '#0369A1' : '#0F172A', marginBottom: 4 }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: isSelected ? '#0284C7' : '#64748B', fontWeight: 600 }}>
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
                        background: 'linear-gradient(180deg, #0284C7 0%, #0369A1 100%)',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                fontFamily: 'var(--font-title)',
                                fontSize: '1.8rem',
                                fontWeight: 900,
                                color: '#1E3A8A',
                                background: '#FEF08A',
                                border: '2px solid var(--comic-black)',
                                padding: '4px 14px',
                                borderRadius: 12,
                                letterSpacing: 2,
                                boxShadow: '0 2px 0 var(--comic-black)'
                              }}>
                                #{r.roomCode}
                              </div>
                              <div>
                                <span style={{
                                  background: '#E0F2FE',
                                  color: '#0369A1',
                                  border: '1.5px solid #BAE6FD',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  marginRight: 8
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
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1E3A8A', marginBottom: 4 }}>
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
                            <div style={{ background: '#F0F9FF', border: '2px solid #BAE6FD', borderRadius: 14, padding: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontWeight: 900, color: '#0284C7', fontSize: '0.92rem' }}>
                                  ⚡ ĐỘI A (TIA CHỚP)
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.teamACount >= max ? '#16A34A' : '#0369A1' }}>
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
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #BAE6FD', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
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
          {/* TAB 2: DANH SÁCH SINH VIÊN ĐĂNG KÝ (STUDENT REGISTRY)    */}
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

                <div style={{ display: 'flex', gap: 10 }}>
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
                    📥 Xuất Excel/CSV
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                <span>
                  Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{registrations.length}</strong> sinh viên đã đăng ký
                </span>
                {searchStudent && (
                  <span style={{ color: '#0284C7' }}>
                    Bộ lọc: "{searchStudent}"
                  </span>
                )}
              </div>

              {/* Students Data Table (2D Neo-brutalism Table) */}
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
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A', width: 50 }}>STT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>HỌ VÀ TÊN</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>MSSV</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>KHOA / NGÀNH</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>SỐ ĐIỆN THOẠI</th>
                        <th style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>NGÀY ĐĂNG KÝ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRegistrations ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            Đang tải danh sách sinh viên...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                            {searchStudent ? 'Không tìm thấy sinh viên nào khớp với từ khóa tìm kiếm.' : 'Chưa có sinh viên nào điền form đăng ký.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => (
                          <tr
                            key={s.id || idx}
                            style={{
                              borderBottom: '1px solid #E2E8F0',
                              background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#64748B' }}>
                              #{idx + 1}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🎓</span>
                                <span>{s.full_name}</span>
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0369A1' }}>
                              <span style={{ background: '#E0F2FE', padding: '2px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>
                                {s.student_id}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                              {s.faculty || 'ĐH Văn Hiến'}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: 700, fontFamily: 'monospace' }}>
                              {s.phone || '---'}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>
                              {s.registered_at ? new Date(s.registered_at).toLocaleString('vi-VN') : '---'}
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

          {/* ======================================================== */}
          {/* TAB 3: LỊCH SỬ CÁC TRẬN ĐẤU (MATCH HISTORY)               */}
          {/* ======================================================== */}
          {activeTab === 'MATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Win/Loss Ratio */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ background: '#F0F9FF', border: '2.5px solid var(--comic-black)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 4px 0 var(--comic-black)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#0369A1', fontWeight: 900 }}>⚡ ĐỘI A THẮNG (TIA CHỚP)</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.4rem', fontWeight: 900, color: '#0284C7' }}>
                    {stats?.winsA || 0} trận
                  </div>
                  <small style={{ color: '#0369A1', fontWeight: 700 }}>
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
                            <td style={{ padding: '12px 14px', fontWeight: 900, color: '#1E3A8A' }}>
                              <span style={{ background: '#FEF08A', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--comic-black)', fontSize: '0.8rem' }}>
                                #{m.match_code || m.room_code || 'MATCH'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 900, fontSize: '1.05rem' }}>
                              <span style={{ color: '#0284C7' }}>{m.score_a ?? 0}</span>
                              <span style={{ color: '#64748B', margin: '0 6px' }}>-</span>
                              <span style={{ color: '#EA580C' }}>{m.score_b ?? 0}</span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {m.winner === 'A' ? (
                                <span style={{ background: '#E0F2FE', color: '#0369A1', border: '1.5px solid #0284C7', padding: '3px 10px', borderRadius: 999, fontWeight: 900, fontSize: '0.78rem' }}>
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
    </div>
  );
}
