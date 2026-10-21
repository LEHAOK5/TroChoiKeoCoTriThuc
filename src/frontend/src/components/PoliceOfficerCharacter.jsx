import React from 'react';

export default function PoliceOfficerCharacter({ isWhistling = true, width = 52, height = 68 }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
      title="Chú Công An Chibi bắt giữ đội thua"
    >
      <svg
        viewBox="0 0 54 70"
        width={width}
        height={height}
        style={{
          filter: 'drop-shadow(0 3px 0 rgba(15, 23, 42, 0.25))',
          animation: 'refereeIdle 2s infinite ease-in-out'
        }}
      >
        {/* Bóng chân */}
        <ellipse cx="27" cy="67" rx="15" ry="3.2" fill="rgba(15, 23, 42, 0.25)" />

        {/* Chân & Giày da đen */}
        <line x1="21" y1="52" x2="19" y2="62" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="33" y1="52" x2="35" y2="62" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
        <rect x="14" y="60" width="11" height="6" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
        <rect x="29" y="60" width="11" height="6" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
        <circle cx="19.5" cy="62" r="1.2" fill="#FFFFFF" />
        <circle cx="34.5" cy="62" r="1.2" fill="#FFFFFF" />

        {/* Thân áo cảnh sát xanh lá & Cầu vai đỏ */}
        <path
          d="M 16 30 C 15 30, 14 44, 18 53 C 23 55, 31 55, 36 53 C 40 44, 39 30, 38 30 Z"
          fill="#15803D"
          stroke="#0F172A"
          strokeWidth="2.4"
        />
        {/* Nẹp cúc áo vàng kim */}
        <line x1="27" y1="34" x2="27" y2="52" stroke="#0F172A" strokeWidth="1.5" />
        <circle cx="27" cy="38" r="1.5" fill="#FACC15" stroke="#0F172A" strokeWidth="0.8" />
        <circle cx="27" cy="44" r="1.5" fill="#FACC15" stroke="#0F172A" strokeWidth="0.8" />
        <circle cx="27" cy="50" r="1.5" fill="#FACC15" stroke="#0F172A" strokeWidth="0.8" />

        {/* Cổ áo sơ mi trắng & Cà vạt đen */}
        <polygon points="27,30 22,34 27,37 32,34" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
        <polygon points="27,34 25,41 27,43 29,41" fill="#0F172A" />

        {/* Cầu vai đỏ viền vàng hai bên */}
        <rect x="15" y="30" width="5.5" height="3" rx="1" fill="#DC2626" stroke="#0F172A" strokeWidth="1" transform="rotate(-15 17 31)" />
        <rect x="33.5" y="30" width="5.5" height="3" rx="1" fill="#DC2626" stroke="#0F172A" strokeWidth="1" transform="rotate(15 36 31)" />

        {/* Tay trái cầm gậy điều lệnh sọc trắng đen */}
        <g>
          <path d="M 17 33 Q 9 38 13 46" fill="none" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 17 33 Q 9 38 13 46" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="13" cy="46" r="3" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.2" />
          {/* Gậy chỉ huy */}
          <line x1="13" y1="46" x2="7" y2="38" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="13" y1="46" x2="10" y2="42" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="9" y1="40" x2="7" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Tay phải cầm CÒNG SỐ 8 (Handcuffs) vàng kim */}
        <g>
          <path d="M 37 33 Q 46 38 42 46" fill="none" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 37 33 Q 46 38 42 46" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="42" cy="46" r="3" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.2" />
          {/* Dây xích & Còng số 8 mạ vàng */}
          <ellipse cx="44" cy="51" rx="2.5" ry="3" fill="none" stroke="#FACC15" strokeWidth="1.5" />
          <ellipse cx="45" cy="57" rx="2.5" ry="3" fill="none" stroke="#FACC15" strokeWidth="1.5" />
          <line x1="44" y1="53" x2="45" y2="55" stroke="#EAB308" strokeWidth="1.5" />
        </g>

        {/* Đầu tròn Chibi */}
        <circle cx="27" cy="19" r="13" fill="#FED7AA" stroke="#0F172A" strokeWidth="2.4" />

        {/* Mắt to tròn nghiêm nghị nhưng đáng yêu */}
        <ellipse cx="23" cy="20" rx="2.8" ry="3.4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.3" />
        <circle cx="23" cy="20" r="1.8" fill="#0F172A" />
        <circle cx="23.6" cy="19.3" r="0.7" fill="#FFFFFF" />

        <ellipse cx="31" cy="20" rx="2.8" ry="3.4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.3" />
        <circle cx="31" cy="20" r="1.8" fill="#0F172A" />
        <circle cx="31.6" cy="19.3" r="0.7" fill="#FFFFFF" />

        {/* Lông mày xếch nghiêm nghị */}
        <path d="M 20 16 L 25 18" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 34 16 L 29 18" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />

        {/* Má hồng */}
        <ellipse cx="18" cy="25" rx="2.2" ry="1.3" fill="rgba(244, 63, 94, 0.4)" />
        <ellipse cx="36" cy="25" rx="2.2" ry="1.3" fill="rgba(244, 63, 94, 0.4)" />

        {/* Còi cảnh sát tuýt ở miệng */}
        {isWhistling ? (
          <g>
            <rect x="25" y="24" width="7" height="4" rx="1.5" fill="#FACC15" stroke="#0F172A" strokeWidth="1" />
            <circle cx="32" cy="26" r="1.5" fill="#EAB308" />
            {/* Luồng sóng âm tuýt còi */}
            <line x1="34" y1="23" x2="39" y2="21" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="35" y1="26" x2="41" y2="26" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="34" y1="29" x2="39" y2="31" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M 25 25 Q 27 28 29 25" fill="none" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
        )}

        {/* MŨ KÊ-PI CÔNG AN (Police Peaked Cap) */}
        {/* Phần vành mũ đen bóng cong */}
        <path d="M 14 15 Q 27 10 40 15 L 43 18 Q 27 14 11 18 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="1.5" />
        {/* Thân nón xanh lá */}
        <path d="M 14 14 Q 27 5 40 14 L 38 10 Q 27 3 16 10 Z" fill="#15803D" stroke="#0F172A" strokeWidth="1.8" />
        <ellipse cx="27" cy="10" rx="12" ry="4" fill="#166534" stroke="#0F172A" strokeWidth="1.5" />
        {/* Dây quai mũ màu vàng kim */}
        <path d="M 16 15 Q 27 18 38 15" fill="none" stroke="#FACC15" strokeWidth="1.8" strokeLinecap="round" />
        {/* Huy hiệu Công An: Vòng tròn đỏ ngôi sao vàng ở giữa */}
        <circle cx="27" cy="9" r="3.2" fill="#DC2626" stroke="#FACC15" strokeWidth="1" />
        <polygon points="27,6.8 27.8,8.8 30,8.8 28.2,10 28.9,12 27,10.8 25.1,12 25.8,10 24,8.8 26.2,8.8" fill="#FACC15" />
      </svg>
    </div>
  );
}
