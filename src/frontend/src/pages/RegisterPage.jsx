import React, { useState } from 'react';
import { unlockAudio, playRegistrationTheme } from '../utils/audio';
import { checkRoomCode } from '../services/api';

export default function RegisterPage({ onRegisterSuccess, onGoAdmin }) {
  const [formData, setFormData] = useState({
    roomCode: '',
    fullName: '',
    studentId: '',
    faculty: '',
    phone: '',
    preferredTeam: 'A',
    consent: true
  });

  const [roomInfo, setRoomInfo] = useState(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-detect room code from URL query parameter (e.g. ?room=8291)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      setFormData(prev => ({ ...prev, roomCode: code }));
      verifyRoom(code);
    }
  }, []);

  const verifyRoom = async (code) => {
    const cleanCode = (code || formData.roomCode).trim().toUpperCase();
    if (!cleanCode) {
      setRoomInfo(null);
      setRoomError('');
      return null;
    }
    setCheckingRoom(true);
    setRoomError('');
    try {
      const info = await checkRoomCode(cleanCode);
      setRoomInfo(info);

      // Auto adjust team if one team is already full
      setFormData(prev => {
        if (!info.canJoinA && info.canJoinB && prev.preferredTeam === 'A') {
          return { ...prev, preferredTeam: 'B' };
        }
        if (!info.canJoinB && info.canJoinA && prev.preferredTeam === 'B') {
          return { ...prev, preferredTeam: 'A' };
        }
        return prev;
      });

      return info;
    } catch (err) {
      setRoomInfo(null);
      setRoomError(err.message || 'Mã phòng không tồn tại hoặc đã đóng');
      return null;
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    unlockAudio(); // Unlock audio context on first user tap for iOS
    setErrorMsg('');

    if (!formData.roomCode.trim()) {
      setErrorMsg('Vui lòng nhập Mã phòng đấu do Ban Tổ Chức cung cấp!');
      return;
    }

    if (!formData.fullName.trim() || !formData.studentId.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên cùng MSSV!');
      return;
    }

    setIsLoading(true);
    try {
      // Check room validity first
      const verified = await verifyRoom(formData.roomCode);
      if (!verified) {
        throw new Error('Mã phòng không hợp lệ hoặc đã bị đóng bởi Ban Tổ Chức!');
      }

      if (verified.isFull) {
        throw new Error(`Phòng #${verified.roomCode} đã đủ ${verified.maxPerTeam * 2} người chơi (${verified.mode})!`);
      }

      await onRegisterSuccess({
        ...formData,
        roomCode: formData.roomCode.trim().toUpperCase()
      });
    } catch (err) {
      setErrorMsg(err.message || 'Đăng ký không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '16px auto', padding: '0 16px', width: '100%' }}>
      {/* Header Motif */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '2.4rem',
            fontWeight: 900,
            letterSpacing: '0.02em',
            color: '#1E40AF',
            textShadow: '2px 2px 0 #93C5FD',
            textTransform: 'uppercase',
            marginBottom: 4
          }}
        >
          KÉO CO TRI THỨC
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span style={{ color: '#334155', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
            Đấu Trường 2D Trí Tuệ IT & Pháp Luật
          </span>
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
        </div>
      </div>

      {/* Registration Comic Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '2.5px solid var(--comic-black)',
          borderRadius: 24,
          padding: '24px 22px',
          boxShadow: '0 6px 0 var(--comic-black)'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>
          📝 ĐĂNG KÝ VÀO PHÒNG ĐẤU
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Nhập mã phòng do Ban Tổ Chức tại quầy cấp và điền thông tin để bắt đầu:
        </p>

        {errorMsg && (
          <div style={{ background: 'rgba(255, 23, 68, 0.2)', border: '1px solid #FF1744', borderRadius: 10, padding: '10px 14px', color: '#FF8080', fontSize: '0.88rem', marginBottom: 14 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} onFocus={() => playRegistrationTheme()}>
          {/* ROOM CODE INPUT (TOP PRIORITY) */}
          <div style={{ marginBottom: 16, background: 'rgba(255, 214, 0, 0.08)', border: '1.5px solid var(--color-steal)', borderRadius: 14, padding: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-steal)', marginBottom: 6 }}>
              🔑 MÃ PHÒNG THI ĐẤU * (Hỏi Ban Tổ Chức tại quầy)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="Ví dụ: 8291"
                value={formData.roomCode}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setFormData({ ...formData, roomCode: val });
                  if (val.length >= 4) verifyRoom(val);
                }}
                onBlur={() => verifyRoom(formData.roomCode)}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: '#FFFFFF',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 12,
                  color: '#0F172A',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  letterSpacing: 2,
                  outline: 'none',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 0 var(--comic-black)'
                }}
              />
              <button
                type="button"
                onClick={() => verifyRoom(formData.roomCode)}
                disabled={checkingRoom || !formData.roomCode.trim()}
                style={{
                  padding: '0 16px',
                  background: '#191AFE',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-title)',
                  cursor: 'pointer'
                }}
              >
                {checkingRoom ? '...' : 'Kiểm tra'}
              </button>
            </div>

            {/* Room Status Indicator */}
            {roomInfo && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#00E676', fontWeight: 700 }}>
                ✅ Phòng hợp lệ: Chế độ {roomInfo.mode} ({roomInfo.maxPerTeam} vs {roomInfo.maxPerTeam}) • Đội A: {roomInfo.teamACount}/{roomInfo.maxPerTeam} • Đội B: {roomInfo.teamBCount}/{roomInfo.maxPerTeam}
              </div>
            )}
            {roomError && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#FF5252', fontWeight: 600 }}>
                ❌ {roomError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Họ và tên sinh viên *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Lê Văn A"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 13px',
                background: '#F8FAFC',
                border: '2px solid #CBD5E1',
                borderRadius: 12,
                color: '#0F172A',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Mã số sinh viên (MSSV) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 21001234"
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 13px',
                background: '#F8FAFC',
                border: '2px solid #CBD5E1',
                borderRadius: 12,
                color: '#0F172A',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Khoa / Viện
              </label>
              <input
                type="text"
                placeholder="CNTT, Luật..."
                value={formData.faculty}
                onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#F8FAFC',
                  border: '2px solid #CBD5E1',
                  borderRadius: 12,
                  color: '#0F172A',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="0912..."
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#F8FAFC',
                  border: '2px solid #CBD5E1',
                  borderRadius: 12,
                  color: '#0F172A',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Chọn Đội A hoặc B */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Chọn Đội Thi Đấu *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Team A Button */}
              {(() => {
                const canJoinA = roomInfo ? roomInfo.canJoinA : true;
                const isSelected = formData.preferredTeam === 'A' && canJoinA;
                return (
                  <button
                    type="button"
                    disabled={!canJoinA}
                    onClick={() => canJoinA && setFormData({ ...formData, preferredTeam: 'A' })}
                    id="select-team-a-btn"
                    style={{
                      padding: '12px 10px',
                      borderRadius: 16,
                      border: !canJoinA
                        ? '2px solid #CBD5E1'
                        : isSelected
                        ? '2.5px solid #0284C7'
                        : '2px solid var(--comic-black)',
                      background: !canJoinA
                        ? '#F1F5F9'
                        : isSelected
                        ? '#E0F2FE'
                        : '#FFFFFF',
                      boxShadow: isSelected ? '0 4px 0 #0284C7' : '0 3px 0 var(--comic-black)',
                      color: !canJoinA ? '#94A3B8' : '#0F172A',
                      cursor: !canJoinA ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      opacity: !canJoinA ? 0.6 : 1,
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>⚡</span>
                    <span style={{ fontWeight: 900, fontFamily: 'var(--font-title)', fontSize: '0.9rem', color: !canJoinA ? '#94A3B8' : '#0284C7' }}>
                      ĐỘI A - TIA CHỚP
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: !canJoinA ? '#EF4444' : isSelected ? '#16A34A' : '#64748B' }}>
                      {!canJoinA
                        ? `🔒 ĐÃ ĐỦ (${roomInfo?.teamACount}/${roomInfo?.maxPerTeam})`
                        : isSelected
                        ? 'Đã chọn ✅'
                        : 'Bấm để chọn'}
                    </span>
                  </button>
                );
              })()}

              {/* Team B Button */}
              {(() => {
                const canJoinB = roomInfo ? roomInfo.canJoinB : true;
                const isSelected = formData.preferredTeam === 'B' && canJoinB;
                return (
                  <button
                    type="button"
                    disabled={!canJoinB}
                    onClick={() => canJoinB && setFormData({ ...formData, preferredTeam: 'B' })}
                    id="select-team-b-btn"
                    style={{
                      padding: '12px 10px',
                      borderRadius: 16,
                      border: !canJoinB
                        ? '2px solid #CBD5E1'
                        : isSelected
                        ? '2.5px solid #EA580C'
                        : '2px solid var(--comic-black)',
                      background: !canJoinB
                        ? '#F1F5F9'
                        : isSelected
                        ? '#FFEDD5'
                        : '#FFFFFF',
                      boxShadow: isSelected ? '0 4px 0 #EA580C' : '0 3px 0 var(--comic-black)',
                      color: !canJoinB ? '#94A3B8' : '#0F172A',
                      cursor: !canJoinB ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      opacity: !canJoinB ? 0.6 : 1,
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>🔥</span>
                    <span style={{ fontWeight: 900, fontFamily: 'var(--font-title)', fontSize: '0.9rem', color: !canJoinB ? '#94A3B8' : '#EA580C' }}>
                      ĐỘI B - NGỌN LỬA
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: !canJoinB ? '#EF4444' : isSelected ? '#16A34A' : '#64748B' }}>
                      {!canJoinB
                        ? `🔒 ĐÃ ĐỦ (${roomInfo?.teamBCount}/${roomInfo?.maxPerTeam})`
                        : isSelected
                        ? 'Đã chọn ✅'
                        : 'Bấm để chọn'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 18px', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            <input
              type="checkbox"
              id="consent"
              checked={formData.consent}
              onChange={e => setFormData({ ...formData, consent: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#191AFE' }}
            />
            <label htmlFor="consent">
              Tôi đồng ý tham gia thi đấu theo thể lệ gian hàng Kéo Co Tri Thức.
            </label>
          </div>

          <button
            type="submit"
            className="btn-tactile"
            disabled={isLoading || !formData.consent || Boolean(roomInfo?.isFull)}
            style={{
              width: '100%',
              height: 54,
              background: roomInfo?.isFull
                ? '#FEE2E2'
                : 'linear-gradient(180deg, #4E4FFF 0%, #191AFE 100%)',
              border: '2.5px solid var(--comic-black)',
              boxShadow: '0 5px 0 var(--comic-black)',
              color: roomInfo?.isFull ? '#DC2626' : '#FFFFFF',
              fontSize: '1.15rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: (isLoading || !formData.consent || Boolean(roomInfo?.isFull)) ? 'not-allowed' : 'pointer'
            }}
            id="register-submit-btn"
          >
            {isLoading
              ? 'Đang vào phòng...'
              : roomInfo?.isFull
              ? `⚠️ PHÒNG ĐÃ ĐỦ ${roomInfo.maxPerTeam * 2} NGƯỜI CHƠI`
              : 'VÀO PHÒNG THI ĐẤU 🚀'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button
          onClick={onGoAdmin}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Trang quản trị dành cho Ban tổ chức (Tạo phòng) 🔒
        </button>
      </div>
    </div>
  );
}
