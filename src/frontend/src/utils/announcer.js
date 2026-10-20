// =====================================================================
// KÉO CO TRI THỨC - GAMESHOW VOICE ANNOUNCER ENGINE (Web Speech API)
// 100% Offline, Zero-latency, Dynamic Natural Vietnamese Voice (vi-VN)
// =====================================================================

import { isMuted } from './audio';

let isVoiceMutedState = false;
try {
  isVoiceMutedState = localStorage.getItem('keoco_voice_muted') === 'true';
} catch (e) {
  isVoiceMutedState = false;
}

const voiceListeners = new Set();

export function isVoiceMuted() {
  return isVoiceMutedState || isMuted();
}

export function setVoiceMuted(muted) {
  isVoiceMutedState = Boolean(muted);
  try {
    localStorage.setItem('keoco_voice_muted', isVoiceMutedState ? 'true' : 'false');
  } catch (e) {}

  if (isVoiceMutedState && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  voiceListeners.forEach(fn => {
    try { fn(isVoiceMutedState); } catch (e) {}
  });

  return isVoiceMutedState;
}

export function toggleVoiceMute() {
  return setVoiceMuted(!isVoiceMutedState);
}

export function subscribeVoiceMute(listener) {
  voiceListeners.add(listener);
  return () => voiceListeners.delete(listener);
}

// Cached voice
let cachedViVoice = null;
let voicesLoaded = false;

function getVietnameseVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (cachedViVoice) return cachedViVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Ưu tiên giọng tiếng Việt tự nhiên chất lượng cao
  const preferred = voices.find(v => 
    (v.lang === 'vi-VN' || v.lang === 'vi_VN' || v.lang === 'vi') &&
    (v.name.includes('Natural') || v.name.includes('HoaiMy') || v.name.includes('NamMinh') || v.name.includes('Google'))
  );
  if (preferred) {
    cachedViVoice = preferred;
    return preferred;
  }

  // 2. Giọng tiếng Việt bất kỳ
  const anyVi = voices.find(v => v.lang.startsWith('vi'));
  if (anyVi) {
    cachedViVoice = anyVi;
    return anyVi;
  }

  return null;
}

// Lắng nghe khi trình duyệt nạp danh sách voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
    cachedViVoice = null;
    getVietnameseVoice();
  };
}

/**
 * Phát âm thanh giọng đọc MC
 */
export function speak(text, options = {}) {
  if (isVoiceMuted()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Huỷ câu đọc cũ nếu có để tránh dồn ứ âm thanh
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = options.rate || 1.1;     // Tốc độ nhanh nhẹn, phong cách gameshow
    utterance.pitch = options.pitch || 1.05;  // Cao độ hào hứng
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    const viVoice = getVietnameseVoice();
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    // Im lặng bỏ qua nếu trình duyệt chặn autoplay âm thanh
  }
}

// =====================================================================
// BỘ CÂU VOICE ANNOUNCER THEO TỪNG DIỄN BIẾN TRẬN ĐẤU
// =====================================================================

// 1. Khi đếm ngược xong, bắt đầu trận đấu
export function announceStart() {
  speak('Sẵn sàng... Bắt đầu!', { rate: 1.12, pitch: 1.1 });
}

// 2. Khi có đội cướp được chuông
export function announceBuzzer(team = 'A') {
  const teamLabel = team === 'A' ? 'Đội A' : 'Đội B';
  const phrases = [
    `${teamLabel} đã cướp chuông!`,
    `Chuông đã thuộc về ${teamLabel}!`
  ];
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  speak(text, { rate: 1.18, pitch: 1.05 });
}

// 3. Khi trả lời đúng (+1Đ)
export function announceCorrect(team = 'A') {
  const teamLabel = team === 'A' ? 'Đội A' : 'Đội B';
  const phrases = [
    'Chính xác tuyệt đối!',
    'Rất xuất sắc! Cộng một điểm!',
    `Câu trả lời chính xác! ${teamLabel} ghi điểm!`,
    'Tuyệt vời! Kéo dây mạnh mẽ!'
  ];
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  speak(text, { rate: 1.12, pitch: 1.15 });
}

// 4. Khi trả lời sai / mất lượt
export function announceWrong(team = 'A') {
  const phrases = [
    'Quá tiếc nuối!',
    'Rất tiếc! Chưa chính xác!',
    'Chưa chính xác rồi!',
    'Mất lượt trả lời!'
  ];
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  speak(text, { rate: 1.08, pitch: 0.95 });
}

// 5. Khi mở lượt cướp điểm (Rebound)
export function announceRebound(reboundTeam = 'B') {
  const teamLabel = reboundTeam === 'B' ? 'Đội B' : 'Đội A';
  speak(`Cơ hội cướp điểm cho ${teamLabel}!`, { rate: 1.15, pitch: 1.1 });
}

// 6. Khi cả 2 đội đều sai
export function announceBothWrong() {
  speak('Cả hai đội đều chưa chính xác!', { rate: 1.05, pitch: 0.95 });
}

// 7. Khi đạt Match Point (Điểm quyết định)
export function announceMatchPoint(team = 'A') {
  const teamLabel = team === 'A' ? 'Đội A' : 'Đội B';
  speak(`Điểm quyết định! Cơ hội vô địch cho ${teamLabel}!`, { rate: 1.12, pitch: 1.2 });
}

// 8. Khi có đội chiến thắng chung cuộc
export function announceVictory(winner = 'A') {
  if (winner === 'DRAW') {
    speak('Trận đấu kết thúc với kết quả hòa nhau!', { rate: 1.05, pitch: 1.05 });
    return;
  }
  const teamLabel = winner === 'A' ? 'Đội A' : 'Đội B';
  const phrases = [
    `Vô địch rồi! Xin chúc mừng ${teamLabel}!`,
    `Chiến thắng tuyệt đối! ${teamLabel} đã giành chức vô địch!`,
    `Chúc mừng ${teamLabel} xuất sắc trở thành nhà vô địch!`
  ];
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  speak(text, { rate: 1.08, pitch: 1.2 });
}
