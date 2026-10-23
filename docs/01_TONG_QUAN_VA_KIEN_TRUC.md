# 🏛️ TỔNG QUAN DỰ ÁN & KIẾN TRÚC HỆ THỐNG

## 1. Giới Thiệu Dự Án
- **Tên dự án:** KÉO CO TRI THỨC (Trạm 1: Thử Thách Tri Tuệ)
- **Mục đích:** Web App trò chơi đối kháng kéo co đối kháng kiến thức thời gian thực phục vụ ngày hội sinh viên, sự kiện tuyển sinh và hoạt động ngoại khóa tại Trường Đại học Văn Hiến (VHU).
- **Bộ câu hỏi:** 600 câu hỏi trắc nghiệm thuộc 2 lĩnh vực:
  - **Công nghệ thông tin (IT):** An toàn thông tin, mạng máy tính, hệ điều hành, phần cứng.
  - **Pháp luật đời sống (Law):** Luật an ninh mạng, quyền sở hữu trí tuệ, luật dân sự sinh viên.

---

## 2. Công Nghệ Sử Dụng (Tech Stack)

### Frontend (`src/frontend`)
- **Framework:** React 18 + Vite (SPA)
- **Styling:** Vanilla CSS (Design system Neo-Brutalism Comic 2D trong `src/styles/index.css`)
- **Hiệu ứng & Hoạt họa:** Canvas-confetti, SVG Chibi nhân vật vẽ tay, CSS Keyframes animation
- **Âm thanh & Phản hồi:** Web Audio API Synthesizer (tự tạo âm không phụ thuộc file mp3 ngoài) & Vibration Haptic API cho điện thoại di động
- **Deploy:** Vercel (Auto-deploy qua branch `main`)

### Backend (`src/backend`)
- **Runtime:** Node.js (v18+) + Express
- **Giao tiếp thời gian thực:** Socket.io (WebSocket với fallback Polling)
- **Cơ sở dữ liệu:** Supabase PostgreSQL qua Connection Pooler
- **Deploy:** Render / Railway (Web Service chạy liên tục hỗ trợ kết nối WebSocket)

---

## 3. Kiến Trúc Luồng Trận Đấu (Game Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor PlayerA as Đội A (Tia Chớp)
    actor PlayerB as Đội B (Ngọn Lửa)
    participant Server as Socket.io Server (GameRoom)
    participant DB as Supabase DB

    Note over PlayerA, PlayerB: Giai đoạn Sảnh (LOBBY)
    PlayerA->>Server: joinRoom & toggleReady
    PlayerB->>Server: joinRoom & toggleReady
    Server-->>PlayerA: startCountdown (3s Face-Off)
    Server-->>PlayerB: startCountdown (3s Face-Off)

    Note over PlayerA, PlayerB: Vòng thi đấu (ROUND_BUZZ)
    Server->>DB: Lấy ngẫu nhiên câu hỏi
    Server-->>PlayerA: newQuestion (IT / Luật) + deadline 15s
    Server-->>PlayerB: newQuestion (IT / Luật) + deadline 15s

    alt Đội A bấm chuông nhanh hơn
        PlayerA->>Server: pressBuzzer (trong mili-giây)
        Server-->>PlayerA: buzzerAwarded (Mở 4 nút trắc nghiệm, 10s)
        Server-->>PlayerB: buzzerAwarded (Khóa màn hình chờ)
        
        alt Đội A trả lời ĐÚNG
            PlayerA->>Server: submitAnswer (đáp án đúng)
            Server->>Server: RopeCalculator: scoreA + 1, ropeOffset - 1
            Server-->>PlayerA: answerResult (Dây giật sang Đội A, âm thanh reo hò)
            Server-->>PlayerB: answerResult (Dây giật sang Đội A)
        else Đội A trả lời SAI
            PlayerA->>Server: submitAnswer (đáp án sai)
            Server-->>PlayerB: reboundOpen (Cướp điểm 8s, loại trừ đáp án sai của A)
        end
    end

    Note over PlayerA, PlayerB: Kết thúc trận (GAME_OVER)
    alt Một đội đạt 10 điểm HOẶC chênh lệch chạm ranh giới
        Server-->>PlayerA: gameOver (winner = 'A')
        Server-->>PlayerB: gameOver (winner = 'A')
        Note over PlayerA, PlayerB: VictoryCutscene: Kéo ngã đối thủ trên sân cỏ (4.2s)
        Note over PlayerA: VictoryModal: Bục #1 Vinh Quang Vàng
        Note over PlayerB: VictoryModal: Nhà tù Meme & Chú Công An
    end
```
