import React from 'react';

export default function RefereeCharacter({ ropeOffset = 0, lastResult = null, isBuzzed = false, winner = null }) {
  // Mắt thẩm phán dõi theo độ lệch dây (-10 đến 10)
  const eyeOffset = Math.max(-2.5, Math.min(2.5, ropeOffset * 0.28));

  // Thẩm phán gõ búa phán quyết khi có chuông, có điểm hoặc có kết quả thắng
  const isWhistling = Boolean(lastResult?.isCorrect || isBuzzed || winner);

  // Xác định hướng phán quyết: Đội A bên trái (isPointingLeft = true), Đội B bên phải (isPointingLeft = false)
  const isPointingLeft = winner === 'A'
    ? true
    : winner === 'B'
    ? false
    : lastResult?.answeringTeam === 'A'
    ? true
    : lastResult?.answeringTeam === 'B'
    ? false
    : ropeOffset < 0;

  // Nội dung khung thoại phán quyết (Speech Bubble)
  let bubbleText = '';
  if (winner === 'A') {
    bubbleText = '🏆 TUYÊN ÁN: ĐỘI A VÔ ĐỊCH!';
  } else if (winner === 'B') {
    bubbleText = '🏆 TUYÊN ÁN: ĐỘI B VÔ ĐỊCH!';
  } else if (winner === 'DRAW') {
    bubbleText = '⚖️ PHÁN QUYẾT: HÒA NHAU!';
  } else if (isBuzzed) {
    bubbleText = '⚖️ PHÁN QUYẾT: CÓ CHUÔNG!';
  } else if (lastResult?.isCorrect) {
    bubbleText = lastResult.answeringTeam === 'A'
      ? '⚖️ ĐỘI A ĐÚNG! +1 ĐIỂM'
      : lastResult.answeringTeam === 'B'
      ? '⚖️ ĐỘI B ĐÚNG! +1 ĐIỂM'
      : '⚖️ CHÍNH XÁC! +1 ĐIỂM';
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '8px',
        transform: 'translateX(-50%)',
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none'
      }}
      title="Vị Thẩm Phán Tri Thức điều khiển trận đấu"
    >
      {/* Khung thoại thông báo phán quyết của Thẩm phán */}
      {bubbleText && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            background: '#FEF08A',
            border: '2px solid #0F172A',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            color: '#713F12',
            boxShadow: '0 2px 0 #0F172A',
            whiteSpace: 'nowrap',
            animation: 'bounceIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 20
          }}
        >
          {bubbleText}
        </div>
      )}

      {/* Khung xoay hướng Thẩm phán về đội được phán quyết */}
      <div
        style={{
          transform: isPointingLeft ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {/* SVG VỊ THẨM PHÁN TRI THỨC CHIBI 2D */}
        <svg
          viewBox="0 0 58 74"
          width="56"
          height="70"
          style={{
            filter: 'drop-shadow(0 3px 0 rgba(15, 23, 42, 0.25))',
            animation: isWhistling ? 'refereeJump 0.4s infinite alternate ease-in-out' : 'refereeIdle 2.2s infinite ease-in-out'
          }}
        >
          {/* Bóng chân */}
          <ellipse cx="29" cy="70" rx="16" ry="3.5" fill="rgba(15, 23, 42, 0.25)" />

          {/* Chân & Giày da đen */}
          <line x1="23" y1="56" x2="21" y2="64" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="35" y1="56" x2="37" y2="64" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
          <rect x="16" y="62" width="11" height="6.5" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
          <rect x="31" y="62" width="11" height="6.5" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
          <circle cx="21.5" cy="64.5" r="1.3" fill="#FFFFFF" />
          <circle cx="36.5" cy="64.5" r="1.3" fill="#FFFFFF" />

          {/* Áo choàng Thẩm phán (Judicial Robe) đen tuyền viền vàng */}
          <path
            d="M 16 32 C 14 32, 13 46, 17 58 C 22 60, 36 60, 41 58 C 45 46, 44 32, 42 32 Z"
            fill="#0F172A"
            stroke="#0F172A"
            strokeWidth="2.4"
          />
          {/* Dải viền áo vàng kim dọc thân */}
          <line x1="29" y1="46" x2="29" y2="59" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />

          {/* Cổ áo nơ đăng-ten trắng xếp tầng thẩm phán (Jabot) */}
          <polygon points="29,31 23,37 35,37" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
          <polygon points="29,35 21,43 37,43" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" />
          <polygon points="29,41 24,47 34,47" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />

          {/* Tay trái Thẩm phán cầm Sách Tri Thức / Bộ Luật bìa đỏ */}
          <g>
            <path d="M 18 34 Q 10 39 14 47" fill="none" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M 18 34 Q 10 39 14 47" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <circle cx="14" cy="48" r="3.2" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.4" />
            {/* Cuốn sách luật bìa đỏ huy hiệu vàng */}
            <rect x="7" y="44" width="7" height="9.5" rx="1.5" fill="#DC2626" stroke="#0F172A" strokeWidth="1.2" transform="rotate(-15 10 48)" />
            <line x1="9" y1="45" x2="13" y2="46" stroke="#FACC15" strokeWidth="1.2" transform="rotate(-15 10 48)" />
          </g>

          {/* Tay phải Thẩm phán cầm BÚA GỖ CÔNG LÝ (Gavel) */}
          {isWhistling ? (
            /* Khi gõ búa phán quyết: Giơ cao búa kèm tia sấm chớp vàng */
            <g>
              {/* Cánh tay áo thụng giơ cao */}
              <path d="M 40 34 Q 50 24 47 16" fill="none" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" />
              <path d="M 40 34 Q 50 24 47 16" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              {/* Bàn tay nắm cán búa */}
              <circle cx="47" cy="16" r="3.2" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.4" />
              {/* Cán búa gỗ */}
              <line x1="47" y1="16" x2="52" y2="6" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
              {/* Đầu búa gỗ công lý viền vàng kim */}
              <rect x="47" y="3" width="11" height="6" rx="1.5" fill="#92400E" stroke="#0F172A" strokeWidth="1.4" transform="rotate(-20 52 6)" />
              <rect x="50" y="3.5" width="5" height="5" fill="#FBBF24" stroke="#0F172A" strokeWidth="0.8" transform="rotate(-20 52 6)" />
              {/* Tia hào quang phán quyết vàng rực */}
              <line x1="53" y1="0" x2="56" y2="-4" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
              <line x1="59" y1="4" x2="64" y2="3" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
              <line x1="44" y1="1" x2="40" y2="-1" stroke="#FACC15" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ) : (
            /* Khi bình thường: Cầm búa gỗ sẵn sàng ngang ngực */
            <g>
              <path d="M 40 34 Q 48 40 43 47" fill="none" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" />
              <path d="M 40 34 Q 48 40 43 47" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <circle cx="43" cy="48" r="3.2" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.4" />
              {/* Cán búa gỗ */}
              <line x1="43" y1="48" x2="48" y2="38" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
              {/* Đầu búa gỗ */}
              <rect x="44" y="35" width="10" height="5.5" rx="1.5" fill="#92400E" stroke="#0F172A" strokeWidth="1.2" transform="rotate(25 49 37)" />
              <rect x="47" y="35.5" width="4" height="4.5" fill="#FBBF24" stroke="#0F172A" strokeWidth="0.8" transform="rotate(25 49 37)" />
            </g>
          )}

          {/* Đầu tròn chibi thẩm phán */}
          <circle cx="29" cy="20" r="13" fill="#FED7AA" stroke="#0F172A" strokeWidth="2.4" />

          {/* BỘ TÓC GIẢ THẨM PHÁN (JUDICIAL WIG) UỐN LỌN BẠCH KIM */}
          {/* Lọn tóc đỉnh đầu */}
          <ellipse cx="29" cy="10" rx="11.5" ry="4.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.8" />
          <path d="M 17 15 C 20 9, 38 9, 41 15 C 38 12, 20 12, 17 15 Z" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          {/* Lọn tóc uốn tròn 3 tầng bên trái */}
          <circle cx="16" cy="16" r="4.2" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="15" cy="22" r="4.2" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="16.5" cy="28" r="3.8" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.8" />
          {/* Lọn tóc uốn tròn 3 tầng bên phải */}
          <circle cx="42" cy="16" r="4.2" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="43" cy="22" r="4.2" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="41.5" cy="28" r="3.8" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.8" />

          {/* KÍNH CẬN TRÒN GỌNG VÀNG TRI THỨC */}
          <circle cx="24" cy="21" r="4.5" fill="none" stroke="#EAB308" strokeWidth="1.8" />
          <circle cx="34" cy="21" r="4.5" fill="none" stroke="#EAB308" strokeWidth="1.8" />
          <path d="M 28.5 21 Q 29 19.5 29.5 21" fill="none" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" />

          {/* MẮT TO TRÒN DÕI THEO DÂY KÉO CO */}
          {/* Mắt trái */}
          <ellipse cx="24" cy="21" rx="2.8" ry="3.4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.3" />
          <circle cx={24 + eyeOffset} cy="21" r="1.8" fill="#0F172A" />
          <circle cx={24 + eyeOffset + 0.6} cy="20.2" r="0.7" fill="#FFFFFF" />

          {/* Mắt phải */}
          <ellipse cx="34" cy="21" rx="2.8" ry="3.4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.3" />
          <circle cx={34 + eyeOffset} cy="21" r="1.8" fill="#0F172A" />
          <circle cx={34 + eyeOffset + 0.6} cy="20.2" r="0.7" fill="#FFFFFF" />

          {/* Má hồng phúng phính */}
          <ellipse cx="19" cy="26" rx="2.4" ry="1.4" fill="rgba(244, 63, 94, 0.4)" />
          <ellipse cx="39" cy="26" rx="2.4" ry="1.4" fill="rgba(244, 63, 94, 0.4)" />

          {/* Miệng Thẩm phán */}
          {isWhistling ? (
            /* Há miệng dõng dạc tuyên bố */
            <g>
              <ellipse cx="29" cy="27" rx="3.4" ry="2.8" fill="#DC2626" stroke="#0F172A" strokeWidth="1.4" />
              <path d="M 26.5 26 Q 29 25 31.5 26" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
            </g>
          ) : (
            /* Nụ cười mỉm thông thái, nghiêm minh */
            <path d="M 26.5 26.5 Q 29 28.8 31.5 26.5" fill="none" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </div>
    </div>
  );
}
