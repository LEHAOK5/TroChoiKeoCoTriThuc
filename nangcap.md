# KẾ HOẠCH NÂNG CẤP TRÒ CHƠI KÉO CO TRI THỨC 🚀
*(Đề xuất cải tiến Âm thanh, Hiệu ứng & Cơ chế Gameplay tạo sức hút tại gian hàng)*

---

## 🔍 I. RÀ SOÁT HIỆN TRẠNG HỆ THỐNG
1. **Giao diện & Đồ họa 2D:**
   - Đã có dàn nhân vật chibi 5vs5 VHU (3 Nam, 2 Nữ) áo Xanh & Cam, dây thừng căng lực, cờ phân định và Trọng tài ra hiệu.
   - Bảng Điều Khiển Ban Tổ Chức (Admin Dashboard) đã có 3 Tab hoàn chỉnh, độ tương phản cao, tra cứu danh sách 69 sinh viên và lịch sử 21 trận đấu.
2. **Hệ thống Âm thanh hiện tại (`audio.js`):**
   - Đã có các hiệu ứng SFX cơ bản bằng Web Audio API (Tiếng bấm chuông, Đúng/Sai, Kéo dây, Còi trọng tài, Fanfare chiến thắng).
   - **Tồn tại:** Chưa có **Nhạc Nền (Background Music - BGM)** chạy xuyên suốt lúc bắt đầu và trong hiệp đấu, khiến không khí giữa các câu hỏi dễ bị trầm lắng khi thí sinh đang suy nghĩ.

---

## 💡 II. CÁC ĐỀ XUẤT NÂNG CẤP TRÒ CHƠI THÊM HẤP DẪN

### 🎵 1. Hệ Thống Nhạc Nền Game Tự Động (Dynamic BGM) — ✅ ĐÃ HOÀN THÀNH & TÍCH HỢP
- **Nhạc Chào Mừng Đăng Ký (Thanh Xuân VHU):**
  - Phát bài hát chính thức **"Đi Giữa Trời Rực Rỡ" (Ngô Lan Hương)** làm nhạc nền ẩn êm dịu (~28% âm lượng) khi sinh viên quét mã và điền thông tin đăng ký tại gian hàng.
  - **Giao diện sạch sẽ:** Hoàn toàn phát nền trong suốt, không hiển thị hình ổ đĩa than, giữ giao diện form đăng ký gọn gàng, thanh lịch.
  - **Chuyển tiếp mượt mà (Crossfade):** Khi sinh viên bấm vào phòng đấu, nhạc "Đi Giữa Trời Rực Rỡ" tự động nhỏ dần (Fade-out trong 0.8s) và chuyển tiếp sang nhạc sân đấu thể thao dồn dập. Khi trở lại trang đăng ký, bài hát tự động phát lại.
- **Nhạc Chờ & Đếm Ngược (Lobby & Countdown):**
  - Giai điệu hành khúc / tiếng trống hội thể thao hào hùng hoặc nhạc điện tử arcade retro sôi động (118 BPM ở sảnh và 138 BPM ở nhịp đếm).
  - Tăng dần nhịp độ dồn dập khi đếm ngược `3 - 2 - 1 - BẮT ĐẦU!`.
- **Nhạc Nền Trận Đấu (Battle BGM Loop):**
  - Đoạn beat thể thao điện tử sôi nổi, tiết tấu dồn dập (130 BPM) bằng Web Audio API tổng hợp độc quyền chạy nền suốt thời gian suy nghĩ và giành quyền bấm chuông.
- **Tăng Tốc Khi Đến Match Point (Tension BGM):**
  - Khi một đội chỉ còn cách vạch thắng 1 bước kéo (hoặc điểm số nguy kịch), nhạc nền tự động đẩy nhanh tempo lên **152 BPM** kết hợp tiếng bass tim đập `thình thịch`, tạo cảm giác nghẹt thở.
- **Nút Bật/Tắt Âm Thanh (Mute/Unmute 🔊/🔇):**
  - Nút bấm Neo-brutalism tinh tế ở góc trên cùng thanh điều hướng (`🔊 BẬT NHẠC` / `🔇 TẮT ÂM`), lưu trạng thái tự động vào `localStorage` giúp Ban Tổ Chức bật/tắt linh hoạt khi cầm mic tại gian hàng.

---

### ⚡ 2. Cơ Chế "Combo Chuỗi Thắng" & "Câu Hỏi Vàng" (Gameplay Buffs)
- **Chuỗi Thắng (Streak Combo x1.5 / x2 Lực Kéo):**
  - Nếu một đội trả lời đúng liên tiếp 2 câu trở lên: Kích hoạt hiệu ứng **"BỐC HỎA / SẤM SÉT"** quanh các nhân vật kéo dây.
  - Lực kéo câu tiếp theo được cộng thêm 50% hoặc nhân đôi, giúp đội tạo khoảng cách bứt phá ngoạn mục.
- **Câu Hỏi Vàng (Golden Question - Lội Ngược Dòng):**
  - Khi một đội đang bị dẫn trước cách biệt lớn, hệ thống có thể kích hoạt ngẫu nhiên 1 *"Câu Hỏi Vàng VHU"*.
  - Nếu đội đang thua trả lời đúng, lực kéo được nhân đôi, kéo phăng dây về lại giữa sân, tạo ra những pha lội ngược dòng (comeback) mãn nhãn khiến khán đài vỡ òa.

---

### 📣 3. Hiệu Ứng Khán Đài & Tiếng Reo Hò Tương Tác (Crowd Stadium FX)
- **Tiếng Cổ Vũ Chân Thật (Crowd Cheer / Ooooh / Yeahhh):**
  - Khi bấm chuông cướp quyền trả lời: Khán giả xì xào hồi hộp.
  - Khi trả lời đúng và dây giật mạnh: Tiếng vỗ tay và reo hò rộn rã `Yeahhhh! 👏🎉`.
  - Khi trả lời sai / mất lượt: Tiếng thở dài tiếc nuối `Oooooh! 😮`.
- **Bong Bóng Cảm Xúc Bay Lên:**
  - Khán đài phía sau tự động bắn ra các icon biểu cảm: 🔥 (Nhiệt huyết), ⚡ (Tia chớp), ❤️ (Cổ vũ VHU), 🏆 (Chiến thắng).

---

### 🎙️ 4. Giọng Thông Báo Âm Thanh Cắt Lát (Voice Announcer SFX)
- Bổ sung các câu voice ngắn phong cách gameshow truyền hình (hoặc AI lồng tiếng tiếng Việt dí dỏm):
  - *"Sẵn sàng... Bắt đầu!"*
  - *"Đội A đã cướp chuông!"*
  - *"Chính xác tuyệt đối!"*
  - *"Quá tiếc nuối!"*
  - *"Vô địch rồi!"*

---

### 💥 5. Hiệu Ứng Rung Màn Hình & Pháo Giấy 3D (Juice FX)
- **Rung Chấn Nhẹ (Screen Shake):**
  - Khi kéo dây thành công, sân đấu rung nhẹ 0.2s tạo cảm giác lực kéo thực sự nặng và có trọng lượng thể thao.
- **Cơn Mưa Pháo Giấy Cực Đại (Confetti Explosion):**
  - Khi xuất hiện màn hình chiến thắng `VictoryCutscene`, pháo hoa và confetti rực rỡ bắn phủ kín màn hình cùng cúp vàng VHU.

---

## 📅 III. LỘ TRÌNH TRIỂN KHAI ĐỀ XUẤT
1. **Giai đoạn 1 (Ưu tiên cao):**
   - Tích hợp Nhạc nền trận đấu (Battle BGM Loop) + Tiếng đếm ngược bắt đầu.
   - Thêm nút bật/tắt âm thanh (Mute/Unmute 🔊/🔇) tiện lợi cho BTC.
2. **Giai đoạn 2 (Trải nghiệm thị giác):**
   - Tích hợp hiệu ứng Combo Chuỗi Thắng (Hiệu ứng lửa/sét quanh nhân vật).
   - Thêm tiếng hò reo khán đài theo nhịp bấm chuông và kết quả câu hỏi.
3. **Giai đoạn 3 (Nâng cao):**
   - Bổ sung cơ chế Câu Hỏi Vàng (Golden Question) lội ngược dòng.
