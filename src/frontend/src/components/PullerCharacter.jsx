import React from 'react';
import vhuLogo from '../img/Logo VHU.png';

export default function PullerCharacter({
  team = 'A',
  index = 0,
  isPulling = false,
  isFallen = false,
  isCheering = false,
  gender = null
}) {
  const isA = team === 'A';

  // 3 Nam, 2 Nữ đan xen:
  // Vị trí 0 (Tiên phong): Nam Chibi
  // Vị trí 1 (Kéo chính 1): Nữ Chibi
  // Vị trí 2 (Trục giữa): Nam Chibi
  // Vị trí 3 (Tiếp lực): Nữ Chibi
  // Vị trí 4 (Khóa đuôi): Nam Chibi
  const isMale = gender ? gender === 'male' : (index % 2 === 0);

  // Bảng màu đồng phục VHU Chibi chuẩn HARMONY (#1A1AFF):
  // Đội A: Xanh HARMONY (#1A1AFF, highlight #4A4AFF, bóng #1010CC)
  // Đội B: Cam Hổ Phách (#EA580C, highlight #FB923C, bóng #C2410C)
  const jerseyColor = isA ? '#1A1AFF' : '#EA580C';
  const jerseyLight = isA ? '#4A4AFF' : '#FB923C';
  const jerseyDark = isA ? '#1010CC' : '#C2410C';
  const shoeColor = isA ? '#1A1AFF' : '#EA580C';
  const hairColor = isMale ? '#1E293B' : '#78350F';
  const hairLight = isMale ? '#475569' : '#B45309';
  const ribbonColor = isA ? '#1A1AFF' : '#EA580C';

  // Góc nghiêng ngả người kéo co chibi đáng yêu
  const baseLeans = [26, 22, 24, 28, 32];
  const currentBaseLean = baseLeans[index] || 25;
  const pullBonus = isPulling ? 6 : 0;
  let leanAngle = isA ? -(currentBaseLean + pullBonus) : (currentBaseLean + pullBonus);
  if (isFallen) {
    const fallenAngles = [70, 56, 64, 46, 52];
    const fa = fallenAngles[index] || 60;
    leanAngle = isA ? -fa : fa;
  } else if (isCheering) {
    leanAngle = isA ? -3 : 3;
  }

  // Anchor hơi mũm mĩm hơn một chút
  const isAnchor = index === 4;
  const scale = isAnchor ? 1.06 : (isMale ? 1.0 : 0.96);

  return (
    <div
      className={`puller-chibi-cute ${isPulling ? 'is-pulling' : ''} ${isCheering ? 'is-cheering' : ''}`}
      style={{
        display: 'inline-block',
        width: 60,
        height: 76,
        transform: `rotate(${leanAngle}deg) scale(${scale}) ${isFallen ? 'translateY(16px)' : ''}`,
        transformOrigin: isA ? 'bottom right' : 'bottom left',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: 'drop-shadow(0 4px 6px rgba(15, 23, 42, 0.25))',
        animation: isCheering
          ? `winnerJump 0.55s infinite alternate ease-in-out ${index * 0.1}s`
          : (!isFallen ? `characterBounce 1.4s infinite ease-in-out ${index * 0.16}s` : 'none'),
        flexShrink: 0,
        position: 'relative',
        zIndex: 10 - index
      }}
      title={`${isMale ? 'Nam sinh' : 'Nữ sinh'} VHU Chibi (Đội ${team}) #${index + 1}`}
    >
      {/* Giọt mồ hôi hoạt hình chibi dễ thương khi đang kéo */}
      {isPulling && !isFallen && (
        <span
          style={{
            position: 'absolute',
            top: -8,
            [isA ? 'right' : 'left']: index % 2 === 0 ? -4 : 0,
            fontSize: '14px',
            animation: 'sweatDrip 0.65s infinite ease-in',
            pointerEvents: 'none',
            zIndex: 30
          }}
        >
          💦
        </span>
      )}

      {/* Sao lấp lánh xoay tròn khi bị ngã */}
      {isFallen && (
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: 14,
            fontSize: '15px',
            animation: 'starSpin 1s infinite linear',
            pointerEvents: 'none',
            zIndex: 30
          }}
        >
          💫
        </span>
      )}

      {/* Hiệu ứng hào hứng lấp lánh khi ăn mừng chiến thắng */}
      {isCheering && (
        <span
          style={{
            position: 'absolute',
            top: -18,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '15px',
            animation: 'starSpin 1.2s infinite linear',
            pointerEvents: 'none',
            zIndex: 30
          }}
        >
          {index % 2 === 0 ? '✨' : '💖'}
        </span>
      )}

      {/* SVG NHÂN VẬT 2D CHIBI SIÊU DỄ THƯƠNG */}
      <svg viewBox="0 0 68 86" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradient màu áo Polo tươi tắn */}
          <linearGradient id={`chibiJersey_${team}_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={jerseyLight} />
            <stop offset="45%" stopColor={jerseyColor} />
            <stop offset="100%" stopColor={jerseyDark} />
          </linearGradient>

          {/* Làn da Chibi hồng hào mịn màng */}
          <linearGradient id="chibiSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF5ED" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          {/* Gradient tóc mượt mà */}
          <linearGradient id={`chibiHair_${isMale ? 'm' : 'f'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hairLight} />
            <stop offset="100%" stopColor={hairColor} />
          </linearGradient>
        </defs>

        {/* --- BÓNG ĐỔ DƯỚI CHÂN --- */}
        <ellipse cx="34" cy="81" rx={isAnchor ? 20 : 16} ry="3.5" fill="rgba(15, 23, 42, 0.25)" />

        {/* --- CHÂN & QUẦN THỂ THAO CHIBI MŨM MĨM --- */}
        {/* Chân sau */}
        <g>
          <path
            d={isA ? "M 27 54 L 16 74" : "M 41 54 L 52 74"}
            stroke="#0F172A"
            strokeWidth="9.5"
            strokeLinecap="round"
          />
          <path
            d={isA ? "M 27 54 L 16 74" : "M 41 54 L 52 74"}
            stroke="#1E293B"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Sọc trắng thể thao */}
          <path
            d={isA ? "M 27 54 L 16 74" : "M 41 54 L 52 74"}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Giày Sneaker Chibi tròn xinh xắn */}
          <g transform={`translate(${isA ? 8 : 44}, 70)`}>
            <rect x="0" y="0" width="16" height="9" rx="4.5" fill={shoeColor} stroke="#0F172A" strokeWidth="1.8" />
            <rect x="0" y="6" width="16" height="3" rx="1.5" fill="#FFFFFF" />
            <circle cx="5" cy="4" r="1.5" fill="#FFFFFF" />
          </g>
        </g>

        {/* Chân trước trụ vững */}
        <g>
          <path
            d={isA ? "M 39 54 L 46 75" : "M 29 54 L 22 75"}
            stroke="#0F172A"
            strokeWidth="9.5"
            strokeLinecap="round"
          />
          <path
            d={isA ? "M 39 54 L 46 75" : "M 29 54 L 22 75"}
            stroke="#1E293B"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Sọc trắng thể thao */}
          <path
            d={isA ? "M 39 54 L 46 75" : "M 29 54 L 22 75"}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Giày Sneaker Chibi trước */}
          <g transform={`translate(${isA ? 40 : 12}, 71)`}>
            <rect x="0" y="0" width="16" height="9" rx="4.5" fill={shoeColor} stroke="#0F172A" strokeWidth="1.8" />
            <rect x="0" y="6" width="16" height="3" rx="1.5" fill="#FFFFFF" />
            <line x1="4" y1="3" x2="11" y2="3" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </g>

        {/* --- THÂN NGƯỜI & ÁO POLO VHU CHIBI DỄ THƯƠNG --- */}
        <g>
          {/* Thân áo Chibi tròn mũm mĩm */}
          <path
            d="M 21 34 C 18 34, 18 53, 23 57 C 29 60, 39 60, 45 57 C 50 53, 50 34, 47 34 Z"
            fill={`url(#chibiJersey_${team}_${index})`}
            stroke="#0F172A"
            strokeWidth="2.4"
          />

          {/* CỔ ÁO BẺ TRẮNG XINH XẮN CỦA VĂN HIẾN */}
          <path
            d="M 23 34 L 34 40 L 45 34 L 40 31 L 34 35 L 28 31 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Nẹp cúc áo */}
          <line x1="34" y1="40" x2="34" y2="45" stroke="#0F172A" strokeWidth="1.2" />
          <circle cx="34" cy="42" r="0.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.6" />

          {/* ⭐ LOGO VHU CHÍNH THỨC (Logo VHU.png) TRÊN NGỰC TRÁI ⭐ */}
          <g transform={isA ? "translate(24, 40)" : "translate(34, 40)"}>
            <circle cx="5" cy="5" r="5.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
            <image
              href={vhuLogo}
              x="0.5"
              y="0.5"
              width="9"
              height="9"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          {/* Số áo chibi nhỏ gọn */}
          <g transform={isA ? "translate(39, 49)" : "translate(22, 49)"}>
            <circle cx="3.5" cy="3.5" r="3.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.8" />
            <text
              x="3.5"
              y="5.6"
              fontSize="5.5"
              fontWeight="900"
              fontFamily="var(--font-title)"
              textAnchor="middle"
              fill={jerseyDark}
            >
              {index + 1}
            </text>
          </g>
        </g>

        {/* --- TAY NẮM DÂY & GĂNG TAY HOẶC GIƠ TAY ĂN MỪNG CHIẾN THẮNG --- */}
        {isCheering ? (
          <g>
            {/* Tay trái giơ cao ăn mừng */}
            <path
              d="M 23 38 Q 12 16 16 8"
              fill="none"
              stroke="#0F172A"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 23 38 Q 12 16 16 8"
              fill="none"
              stroke="url(#chibiSkin)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="7" r="4.2" fill={jerseyLight} stroke="#0F172A" strokeWidth="1.2" />

            {/* Tay phải giơ cao chữ V */}
            <path
              d="M 45 38 Q 56 16 52 8"
              fill="none"
              stroke="#0F172A"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 45 38 Q 56 16 52 8"
              fill="none"
              stroke="url(#chibiSkin)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="52" cy="7" r="4.2" fill={jerseyLight} stroke="#0F172A" strokeWidth="1.2" />
          </g>
        ) : (
          <g>
            {/* Tay sau kéo ghì */}
            <path
              d={isA ? "M 24 38 Q 13 46 32 50" : "M 44 38 Q 55 46 36 50"}
              fill="none"
              stroke="#0F172A"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d={isA ? "M 24 38 Q 13 46 32 50" : "M 44 38 Q 55 46 36 50"}
              fill="none"
              stroke="url(#chibiSkin)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Tay trước vươn nắm */}
            <path
              d={isA ? "M 43 39 Q 33 49 35 52" : "M 25 39 Q 35 49 33 52"}
              fill="none"
              stroke="#0F172A"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d={isA ? "M 43 39 Q 33 49 35 52" : "M 25 39 Q 35 49 33 52"}
              fill="none"
              stroke="url(#chibiSkin)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Găng tay chibi tròn mũm mĩm ôm lấy dây */}
            <circle cx="34" cy="51" r="5" fill="#334155" stroke="#0F172A" strokeWidth="1.8" />
            <path d="M 32 49 L 36 53" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* --- NỮ SINH CHIBI: TÓC ĐUÔI NGỰA & NƠ BƯỚM TO BỒNG BỀNH --- */}
        {!isMale && (
          <g>
            {/* Đuôi ngựa bồng bềnh tung tẩy */}
            <path
              d={isA
                ? "M 44 19 C 56 11, 64 21, 58 34 C 52 37, 48 27, 44 24 Z"
                : "M 24 19 C 12 11, 4 21, 10 34 C 16 37, 20 27, 24 24 Z"}
              fill={`url(#chibiHair_f)`}
              stroke="#0F172A"
              strokeWidth="2.2"
            />
            {/* Lọn sáng trên tóc đuôi ngựa */}
            <path
              d={isA ? "M 47 18 Q 56 16 56 24" : "M 21 18 Q 12 16 12 24"}
              stroke="#FDBA74"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Nơ bướm to cực dễ thương */}
            <ellipse
              cx={isA ? 45 : 23}
              cy="21"
              rx="4"
              ry="4.5"
              fill={ribbonColor}
              stroke="#0F172A"
              strokeWidth="1.5"
            />
            <circle cx={isA ? 45 : 23} cy="21" r="1.5" fill="#FFFFFF" />
          </g>
        )}

        {/* --- ĐẦU CHIBI TRÒN TRĨNH ĐÁNG YÊU (CUTE CHIBI HEAD & CHEEKS) --- */}
        <circle
          cx="34"
          cy="21"
          r="16"
          fill="url(#chibiSkin)"
          stroke="#0F172A"
          strokeWidth="2.4"
        />

        {/* Đôi má bánh bao ửng hồng phấn cực dễ thương */}
        <ellipse cx="23" cy="27" rx="3.5" ry="2" fill="rgba(244, 63, 94, 0.45)" />
        <ellipse cx="45" cy="27" rx="3.5" ry="2" fill="rgba(244, 63, 94, 0.45)" />
        {/* Đốm sáng trên má hồng */}
        <circle cx="22" cy="26" r="0.8" fill="#FFFFFF" />
        <circle cx="46" cy="26" r="0.8" fill="#FFFFFF" />

        {/* Tai chibi nhỏ nhắn */}
        <circle cx={isA ? "19" : "49"} cy="23" r="3" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
        {!isMale && (
          /* Bông tai ngôi sao vàng nhỏ xinh */
          <circle cx={isA ? "19" : "49"} cy="25" r="1.3" fill="#FACC15" />
        )}

        {/* --- KIỂU TÓC CHIBI (NAM BĂNG ĐÔ / NỮ MÁI BẦU) --- */}
        {isMale ? (
          <g>
            {/* Tóc nam spiky tròn trịa dễ thương */}
            <path
              d="M 18 20 C 17 9, 25 4, 34 4 C 43 4, 51 9, 50 20 C 46 11, 41 14, 36 9 C 31 15, 26 10, 18 20 Z"
              fill="url(#chibiHair_m)"
              stroke="#0F172A"
              strokeWidth="2.2"
            />
            {/* Băng đô thể thao chibi */}
            <path
              d="M 19 17 Q 34 11 49 17 L 48 21 Q 34 15 20 21 Z"
              fill={jerseyColor}
              stroke="#0F172A"
              strokeWidth="1.6"
            />
            {/* Biểu tượng ⚡ hoặc 🔥 trên băng đô */}
            <text
              x="34"
              y="18.5"
              fontSize="6"
              textAnchor="middle"
              fill="#FFFFFF"
              fontWeight="900"
            >
              {isA ? '⚡' : '🔥'}
            </text>
          </g>
        ) : (
          <g>
            {/* Tóc nữ mái bầu anime chibi */}
            <path
              d="M 18 20 C 17 9, 25 5, 34 5 C 43 5, 51 9, 50 20 C 46 12, 42 12, 37 10 C 33 15, 28 13, 24 17 C 21 16, 19 18, 18 20 Z"
              fill="url(#chibiHair_f)"
              stroke="#0F172A"
              strokeWidth="2.2"
            />
            {/* Lọn tóc mái cong nhẹ hai bên má */}
            <path d="M 21 19 Q 20 25 22 28" stroke="#451A03" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 47 19 Q 48 25 46 28" stroke="#451A03" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* --- ĐÔI MẮT KAWAII LẤP LÁNH & BIỂU CẢM DỄ THƯƠNG --- */}
        {isCheering ? (
          /* Trạng thái vui mừng chiến thắng (Mắt cười tít ^ ^ và nụ cười rạng rỡ) */
          <g>
            <path d="M 25 24 Q 28 18 31 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 37 24 Q 40 18 43 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 29 27 Q 34 37 39 27 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 31 27 Q 34 29 37 27" fill="#FFFFFF" />
          </g>
        ) : isFallen ? (
          /* Trạng thái ngã (Mắt xoay tròn @ @ đáng yêu) */
          <g stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
            <line x1="25" y1="20" x2="30" y2="25" />
            <line x1="30" y1="20" x2="25" y2="25" />
            <line x1="38" y1="20" x2="43" y2="25" />
            <line x1="43" y1="20" x2="38" y2="25" />
            {/* Miệng lượn sóng choáng váng */}
            <path d="M 30 30 Q 34 27 38 30" fill="none" strokeWidth="1.8" />
          </g>
        ) : isPulling ? (
          /* Trạng thái gồng lực kéo (> < hoặc nghiến răng phúng phính dễ thương) */
          <g>
            {/* Chân mày chúi xuống tập trung */}
            <path
              d={isA ? "M 24 17 L 31 19" : "M 24 19 L 31 17"}
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d={isA ? "M 37 19 L 44 17" : "M 37 17 L 44 19"}
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Mắt nheo gồng lực hình cánh hoa (> <) ngộ nghĩnh */}
            <path
              d={isA ? "M 25 22 L 31 24 L 25 26" : "M 31 22 L 25 24 L 31 26"}
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={isA ? "M 37 22 L 43 24 L 37 26" : "M 43 22 L 37 24 L 43 26"}
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hàm răng cắn chặt phồng má */}
            <rect x="29" y="28" width="10" height="4.5" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="34" y1="28" x2="34" y2="32.5" stroke="#0F172A" strokeWidth="1" />
          </g>
        ) : index === 0 ? (
          /* Tiên phong Chibi há miệng to hô "DÔ TA!" */
          <g>
            {/* Chân mày vui vẻ */}
            <path d="M 25 17 Q 29 15 32 18" stroke="#0F172A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 36 18 Q 39 15 43 17" stroke="#0F172A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Mắt to tròn lấp lánh 2 đốm sáng (Anime Kawaii Eyes) */}
            <ellipse cx="28" cy="22" rx="3.5" ry="4.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
            <circle cx={isA ? "29" : "27"} cy="22" r="2.4" fill="#0F172A" />
            <circle cx={isA ? "29.8" : "26.2"} cy="20.8" r="1.1" fill="#FFFFFF" />
            <circle cx={isA ? "28.2" : "27.8"} cy="23.2" r="0.6" fill="#FFFFFF" />

            <ellipse cx="40" cy="22" rx="3.5" ry="4.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
            <circle cx={isA ? "41" : "39"} cy="22" r="2.4" fill="#0F172A" />
            <circle cx={isA ? "41.8" : "38.2"} cy="20.8" r="1.1" fill="#FFFFFF" />
            <circle cx={isA ? "40.2" : "39.8"} cy="23.2" r="0.6" fill="#FFFFFF" />

            {/* Miệng há to hình chữ D phấn khích */}
            <path d="M 30 28 Q 34 35 38 28 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 32 28 Q 34 30 36 28" fill="#FFFFFF" />
          </g>
        ) : (
          /* Mắt Anime Chibi tròn xoe đáng yêu, tự tin mỉm cười */
          <g>
            <path d="M 25 17 Q 28 16 31 18" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M 37 18 Q 40 16 43 17" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />

            {/* Mắt trái tròn to lấp lánh */}
            <ellipse cx="28" cy="22" rx="3.5" ry="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
            <circle cx={isA ? "29" : "27"} cy="22" r="2.5" fill="#0F172A" />
            <circle cx={isA ? "29.8" : "26.2"} cy="20.8" r="1.2" fill="#FFFFFF" />
            <circle cx={isA ? "28.2" : "27.8"} cy="23.5" r="0.6" fill="#FFFFFF" />

            {/* Mắt phải tròn to lấp lánh */}
            <ellipse cx="40" cy="22" rx="3.5" ry="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
            <circle cx={isA ? "41" : "39"} cy="22" r="2.5" fill="#0F172A" />
            <circle cx={isA ? "41.8" : "38.2"} cy="20.8" r="1.2" fill="#FFFFFF" />
            <circle cx={isA ? "40.2" : "39.8"} cy="23.5" r="0.6" fill="#FFFFFF" />

            {/* Nụ cười mèo con đáng yêu :3 */}
            <path d="M 31 29 Q 34 33 37 29" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}
