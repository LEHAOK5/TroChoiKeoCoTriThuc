# 🚀 KẾ HOẠCH PHÁT TRIỂN TIẾP THEO (ROADMAP)

Tài liệu này ghi lại các ý tưởng và tính năng dự kiến mở rộng trong tương lai. Khi bắt đầu một phiên làm việc mới, bạn có thể chỉ định AI xem tài liệu này để triển khai tiếp.

---

## 0. Hệ Thống 4 Thẻ Bài Chiến Thuật (Tactical Cards & Power-Ups) — [Kế Hoạch Đang Triển Khai]
Cơ chế nâng cấp lối chơi giúp trận đấu thêm phần gay cấn, lật kèo kịch tính tại gian hàng sự kiện, lấy cảm hứng từ 2 lĩnh vực đào tạo của Trường Đại học Văn Hiến: **Công nghệ thông tin** và **Pháp luật**.

### 🃏 Danh sách 4 Thẻ Bài Chiến Thuật Cốt Lõi:
1. **🛡️ TƯỜNG LỬA (FIREWALL) — IT / An toàn mạng:**
   - *Thời điểm:* Kích hoạt khi đang giữ quyền trả lời chính (10s), trước khi bấm đáp án.
   - *Tác dụng:* **Chống cướp điểm Rebound.** Nếu trả lời SAI, hủy câu hỏi ngay lập tức, khóa 8s Rebound của đối phương. Không đội nào có điểm.
   - *Hiệu ứng:* Màng bảo vệ lục giác xanh `#1A1AFF` bao quanh 5 Chibi; âm thanh Shield Up.
2. **❄️ TẤN CÔNG DDoS (DDOS ATTACK) — IT / Mạng máy tính:**
   - *Thời điểm:* Giai đoạn bấm chuông (15s `ROUND_BUZZ`) khi chưa ai bấm chuông.
   - *Tác dụng:* **Đóng băng nút chuông của đối phương trong 2.5 giây đầu.** Server từ chối mọi sự kiện `pressBuzzer` từ đội bị tấn công trong 2.5s đó.
   - *Hiệu ứng:* Nút chuông vàng 3D bị phủ băng xanh trắng nứt nẻ, rung phản hồi điện thoại (Haptic API). Chibi hiện bóng thoại *"🥶 Bị DDoS lag quá!"*.
3. **⚖️ KHÁNG CÁO TỐI CAO (DOUBLE PULL) — Pháp Luật / Pháp Đình:**
   - *Thời điểm:* Trong 15s bấm chuông hoặc trong 3s đầu sau khi giành quyền trả lời.
   - *Tác dụng:* **Nhân đôi lực kéo (+2 điểm).** Trả lời ĐÚNG được cộng 2 điểm (giật dây 2 nấc). Nếu trả lời SAI: Bị phạt lùi dây 1 nấc về đối phương và đối phương vẫn được quyền Rebound.
   - *Hiệu ứng:* Thẩm phán gõ búa công lý 2 lần, mắt kính lóe sáng vàng kim `#FACC15`, dây kéo co phát sáng rực lửa + bóng thoại *"⚡⚖️ KHÁNG CÁO X2 LỰC KÉO!"*.
4. **🔍 LUẬT SƯ TƯ VẤN (50/50 LEGAL ADVICE) — Pháp Luật / Tư Vấn:**
   - *Thời điểm:* Khi 4 đáp án A-B-C-D đang mở (trong 10s trả lời hoặc 8s Rebound).
   - *Tác dụng:* **Gạch bỏ 2 đáp án sai ngẫu nhiên**, chỉ để lại 1 đáp án đúng và 1 đáp án sai trên màn hình đội dùng thẻ.
   - *Hiệu ứng:* 2 nút đáp án sai bị mờ (opacity 0.35), khóa click, đóng dấu mộc đỏ chéo ngang **"BÁC BỎ"** phong cách Neo-Brutalism.

### ⚖️ Luật Cân Bằng & Vận Hành Kỹ Thuật:
- **Giới hạn số lần dùng:** Mỗi thẻ chỉ được kích hoạt **1 lần duy nhất trong suốt trận đấu**.
- **Giới hạn mỗi hiệp:** Mỗi câu hỏi chỉ cho phép mỗi đội kích hoạt tối đa 1 thẻ bài.
- **In-Memory State:** Lưu trên RAM của `GameRoom` (Node.js), không ghi DB, độ trễ mili-giây.
- **Chuẩn giao diện:** Thanh ngang `TacticalCardBar` cao `< 42px` trên Mobile, đảm bảo chiều cao toàn màn hình trọn vẹn `100dvh` (không có thanh cuộn).

---

## 1. Giai Đoạn 2: Mở Rộng Sang "Trạm 2 - Đổi Quà & Vinh Danh"
Hiện tại, cả màn hình đội thắng và đội thua đều có thông báo: *"Hãy cùng tiến đến Trạm 2 để nhận quà kỷ niệm!"* cùng mã trận đấu (`matchCode`).

### Tính năng dự kiến cho Trạm 2:
- **Tạo Mã QR Trao Quà Cá Nhân:**
  - Sau khi kết thúc trận, hệ thống tự động sinh mã QR chứa thông tin: Tên sinh viên, MSSV, Đội, Tỷ số trận đấu và loại phần thưởng (Nhất / Nhì / Khuyến khích).
  - Tình nguyện viên tại Trạm 2 chỉ cần quét QR bằng camera điện thoại để xác nhận và tích điểm đổi quà.
- **Gian Hàng Đổi Quà Ảo (Digital Gift Voucher):**
  - Mở một màn hình quay số may mắn (Vòng quay may mắn / Hộp quà bí mật) cho sinh viên sau khi hoàn thành trận kéo co.

---

## 2. Nâng Cấp Gameplay & Trải Nghiệm Người Dùng (UX)

### A. Bảng Xếp Hạng Trực Tiếp (Realtime Leaderboard)
- Màn hình dành riêng cho màn chiếu LED / Tivi gian hàng.
- Xếp hạng top các đội có chuỗi thắng dài nhất trong ngày hội, thời gian trả lời câu hỏi nhanh nhất.

### B. Chế Độ Huấn Luyện / Đấu Với Bot Thông Minh (Practice Mode)
- Nâng cấp Bot luyện tập có các mức độ khó:
  - *Dễ:* Trả lời sau 8s, tỉ lệ đúng 50%.
  - *Khó:* Trả lời sau 4s, tỉ lệ đúng 85%.

### C. Giọng Nói Bình Luận Viên Ảo (AI Voice MC)
- Sử dụng Web Speech API hoặc các file voice thu âm sẵn để đọc câu hỏi, hô tên đội giành quyền trả lời và đếm ngược thời gian hồi hộp.

### D. Tùy Biến Chủ Đề Câu Hỏi Theo Sự Kiện
- Cho phép Admin chọn chủ đề câu hỏi trước mỗi trận (ví dụ: Trận chuyên sâu "An ninh mạng", Trận chuyên sâu "Luật sinh viên", hoặc Trận giao lưu "Đố vui VHU").
