# KÉO CO TRI THỨC (Phiên Bản 2.0)
> **Web App Game Đối Kháng Thời Gian Thực Trên Thiết Bị Người Chơi (Điện thoại / Laptop)**  
> **Chủ đề kiến thức:** Công nghệ thông tin (IT) & Pháp luật đời sống (600 câu hỏi trắc nghiệm)  
> **Kiến trúc:** Tách biệt độc lập `src/backend` (Node.js, Express, Socket.io) và `src/frontend` (React, Vite). Frontend gọi Backend qua biến môi trường `VITE_API_URL`.

---

## 📁 Cấu trúc Thư mục Chuẩn Hóa

```text
KEOCOTRITHUC/
├── docs/                                   # Tài liệu dự án (kehoach.docx, Thể lệ cuộc thi, Sơ đồ luồng)
├── references/                             # Repo mã nguồn mở tham khảo (ttalkkakthon-tug-of-war, kahoot-clone)
├── README.md                               # Hướng dẫn khởi chạy và vận hành
└── src/
    ├── backend/                            # ===== BACKEND (Node.js + Express + Socket.io) =====
    │   ├── package.json
    │   ├── .env / .env.example
    │   ├── database/
    │   │   ├── supabase_init.sql           # Script khởi tạo CSDL và RLS trên Supabase
    │   │   └── seed_questions.py           # Nạp 600 câu hỏi IT & Luật vào Supabase
    │   ├── src/
    │   │   ├── server.js                   # Điểm khởi chạy HTTP Server + Socket.io Gateway
    │   │   ├── app.js                      # Express App: CORS, JSON, REST API routes
    │   │   ├── config/ (env, cors, constants)
    │   │   ├── routes/ (health, register, rooms, matches, admin)
    │   │   ├── repositories/ (questions, registrations, matches)
    │   │   ├── db/pool.js                  # Kết nối Supabase Pooler (PostgreSQL)
    │   │   ├── sockets/ (index, roomHandlers, gameHandlers)
    │   │   ├── game/                       # Lõi Game: RoomManager, GameRoom, BuzzerEngine, ReboundLaw, RopeCalculator
    │   │   ├── middlewares/ (adminAuth, errorHandler, rateLimiter)
    │   │   └── utils/ (session, matchCode, logger)
    │   └── tests/e2e/test_gameplay.js      # Kịch bản kiểm thử tự động 2 client qua WebSocket
    │
    └── frontend/                           # ===== FRONTEND (React 18 + Vite) =====
        ├── package.json
        ├── .env / .env.example             # VITE_API_URL=http://localhost:4000
        ├── vite.config.js
        ├── vercel.json                     # Rewrite SPA cho Vercel deploy
        ├── index.html                      # Meta viewport, Google Fonts (Baloo 2, Be Vietnam Pro)
        └── src/
            ├── main.jsx
            ├── App.jsx                     # Router, Socket listeners, Audio triggers
            ├── config/env.js               # export const API_URL = import.meta.env.VITE_API_URL
            ├── services/ (api.js, socket.js)
            ├── utils/ (audio.js, haptics.js) # Web Audio API Synthesizer & Vibration API
            ├── components/
            │   ├── ConnectionBadge.jsx     # Chấm xanh/đỏ + đo ping RTT
            │   ├── TugOfWarArena.jsx       # Vũ đài kéo co, Tia Chớp ⚡ vs Ngọn Lửa 🔥, dây thừng đàn hồi
            │   ├── QuestionBox.jsx         # Khung câu hỏi [IT]/[LUẬT], đồng hồ deadline server
            │   ├── BuzzerControl.jsx       # 5 trạng thái: Chuông 165px / 4 nút đáp án ⚪🔺⏹️🔶 / Cướp điểm 8s
            │   ├── CountdownOverlay.jsx    # Lớp phủ đếm ngược 3-2-1
            │   ├── FeedbackOverlay.jsx     # Kết quả Đúng/Sai/Hết giờ kèm giải thích
            │   └── VictoryModal.jsx        # Vinh danh vô địch 10 điểm, pháo hoa confetti
            ├── pages/
            │   ├── RegisterPage.jsx        # Đăng ký thông tin sinh viên
            │   ├── LobbyPage.jsx           # Chọn đội, sảnh chờ, sẵn sàng
            │   ├── GamePage.jsx            # Màn hình thi đấu hợp nhất (3 tầng)
            │   └── admin/AdminPage.jsx     # Trang quản trị: thống kê, xuất CSV, phòng trực tiếp
            └── styles/index.css            # Design System "Neo-arcade tactile glass"
```

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Development)

### 1. Khởi chạy Backend (Port 4000)
```bash
cd src/backend
npm install
npm run dev
```
* **REST API:** `http://localhost:4000`
* **Kiểm tra sức khỏe:** `http://localhost:4000/api/health`
* **Chạy kiểm thử E2E tự động:** `npm run test:e2e`

### 2. Khởi chạy Frontend (Port 5173)
```bash
cd src/frontend
npm install
npm run dev
```
* **Truy cập web app:** [http://localhost:5173/](http://localhost:5173/)

---

## 🔒 Quản Trị Viên Gian Hàng (Admin Dashboard)
* Truy cập trực tiếp tại nút chân trang đăng ký hoặc vào đường dẫn Admin trên giao diện.
* **Khóa quản trị mặc định (x-admin-key):** `keoco_admin_secret_2026` (cấu hình trong `src/backend/.env`).
* **Tính năng:**
  - Xem số lượng đăng ký, số câu hỏi trong kho, số trận đã đấu, số phòng đang chạy.
  - Tải file CSV toàn bộ danh sách sinh viên tham gia gian hàng để trao giải.
  - Theo dõi danh sách các phòng đấu thời gian thực.

---

## 🌐 Hướng Dẫn Triển Khai (Deploy Cloud)
* **Frontend:** Deploy lên **Vercel** từ thư mục gốc `src/frontend` (đặt biến `VITE_API_URL` trỏ về backend). Đã có sẵn file `vercel.json` phục vụ SPA routing.
* **Backend:** Deploy lên dịch vụ chạy liên tục hỗ trợ WebSocket (**Render / Railway / Fly.io**) từ thư mục gốc `src/backend` (đặt các biến trong `src/backend/.env.example`).
