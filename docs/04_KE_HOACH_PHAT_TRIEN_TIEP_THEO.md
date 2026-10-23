# 🚀 KẾ HOẠCH PHÁT TRIỂN TIẾP THEO (ROADMAP)

Tài liệu này ghi lại các ý tưởng và tính năng dự kiến mở rộng trong tương lai. Khi bắt đầu một phiên làm việc mới, bạn có thể chỉ định AI xem tài liệu này để triển khai tiếp.

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
