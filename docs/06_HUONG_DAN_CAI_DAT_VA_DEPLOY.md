# ⚙️ HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & TRIỂN KHAI

Tài liệu này hướng dẫn cách chạy dự án ở môi trường máy cá nhân (Localhost) và cấu hình đưa lên môi trường máy chủ đám mây (Cloud Deploy).

---

## 1. Yêu Cầu Môi Trường
- **Node.js:** Phiên bản `>= 18.x`
- **NPM:** Phiên bản `>= 9.x`
- **Git**

---

## 2. Khởi Chạy Môi Trường Cục Bộ (Local Development)

### Bước 1: Khởi động Backend (Port 4000)
Mở một cửa sổ Terminal (PowerShell):
```powershell
cd d:\KEOCOTRITHUC\src\backend
npm install
npm run dev
```
- Server chạy tại: `http://localhost:4000`
- Kiểm tra kết nối API: `http://localhost:4000/api/health`
- Chạy kiểm thử tự động WebSocket: `npm run test:e2e`

### Bước 2: Khởi động Frontend (Port 5173)
Mở một cửa sổ Terminal thứ hai:
```powershell
cd d:\KEOCOTRITHUC\src\frontend
npm install
npm run dev
```
- Truy cập giao diện người chơi: `http://localhost:5173`

---

## 3. Cấu Hình Biến Môi Trường (.env)

### Backend: `src/backend/.env`
```env
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,https://keo-co-tri-thuc.vercel.app
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
ADMIN_API_KEY=keoco_admin_secret_2026
SESSION_SECRET=keoco_session_secret_jwt
WIN_SCORE=10
BUZZ_TIMEOUT_SEC=15
ANSWER_TIMEOUT_SEC=10
REBOUND_TIMEOUT_SEC=8
MAX_PLAYERS_PER_TEAM=5
```

### Frontend: `src/frontend/.env`
- **Chạy local:**
  ```env
  VITE_API_URL=http://localhost:4000
  ```
- **Chạy production:**
  ```env
  VITE_API_URL=https://keoco-backend.onrender.com
  ```

---

## 4. Hướng Dẫn Triển Khai Lên Đám Mây (Cloud Deployment)

### Frontend (Triển khai trên Vercel)
- **Framework Preset:** Vite
- **Root Directory:** `src/frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_URL` trỏ đến link Backend Render.
- Đã có sẵn file `src/frontend/vercel.json` phục vụ Rewrite SPA URL không bị lỗi 404 khi F5.

### Backend (Triển khai trên Render / Railway)
- **Environment:** Node
- **Root Directory:** `src/backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Auto Deploy:** Bật tự động nhận diện commit từ nhánh `main`.
