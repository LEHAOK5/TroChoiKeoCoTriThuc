# 🎮 KẾ HOẠCH THIẾT KẾ GIAO DIỆN 2D GAME CHO TRÒ CHƠI "KÉO CO TRI THỨC"
> **Lấy cảm hứng từ:** Phong cách Game Hoạt Hình 2D Cartoon / Neo-brutalism Game UI (Tương tự *Đội Điều Tra Số* - *Case Hunter*)  
> **Tông màu chủ đạo:** **XANH DƯƠNG CÔNG NGHỆ & ĐẠI DƯƠNG (Vibrant Tech Blue & Comic 2D)**  
> **Mục tiêu:** Nâng cấp toàn diện trải nghiệm hình ảnh, biến Web App thành một trò chơi đối kháng hoạt hình sống động, lôi cuốn, tạo ấn tượng mạnh mẽ cho sinh viên tại ngày hội gian hàng.

---

## 🌟 I. TỔNG QUAN ĐỊNH HƯỚNG THIẾT KẾ

### 1. Ý tưởng cốt lõi (Core Visual Concept)
- **Tạm biệt giao diện Cyber u tối:** Thay thế phong cách kính mờ (Glassmorphism nền tối) trước đây bằng giao diện **Comic 2D Game rực rỡ, sáng sủa, sắc nét và tràn đầy năng lượng**.
- **Chất hoạt hình vui nhộn (Cartoon & Playful):** Đường nét dày dặn, màu sắc bắt mắt, nhân vật biểu cảm ngộ nghĩnh (gồng mình kéo dây, toát mồ hôi, ăn mừng chiến thắng).
- **Cảm giác xúc giác chân thực (Tactile 3D Buttons):** Nút bấm có khối nổi 3D, bóng đổ cứng (hard shadow), khi chạm/click có độ lún đàn hồi như bàn phím cơ và các máy chơi game Arcade.

### 2. Bảng màu chủ đạo: Hệ thống Xanh Dương (Vibrant Blue Palette)

| Vai trò | Mã màu Hex | Ý nghĩa & Vị trí áp dụng |
| :--- | :--- | :--- |
| **Xanh Dương Chủ Đạo (Primary Blue)** | `#1E40AF` -> `#2563EB` | Màu thương hiệu, khung viền câu hỏi, thanh điều hướng, các nút bấm chính. |
| **Nền Game Sáng (Sky Backdrop)** | `#F0F7FF` -> `#E0EFFF` | Nền màn hình chính thay cho nền đen, dịu mắt, làm nổi bật các khối màu. |
| **Xanh Cyan Công Nghệ (Accent Cyan)** | `#00D2FF` | Màu nhận diện Đội A (Tia Chớp ⚡), các hiệu ứng sấm sét công nghệ. |
| **Cam San Hô Tương Phản (Opponent Fire)**| `#FF5722` -> `#FF7A00` | Màu nhận diện Đội B (Ngọn Lửa 🔥), tạo sự kịch tính đối kháng cực rõ với Đội A. |
| **Vàng Chuông Gameshow (Gold Bell)** | `#FACC15` -> `#F59E0B` | Nút bấm chuêng vàng khổng lồ, cúp vàng chiến thắng, ngôi sao điểm thưởng. |
| **Viền Nét Vẽ Hoạt Hình (Comic Stroke)**| `#0F172A` (2px - 3.5px) | Viền đen đậm quanh tất cả nhân vật, hộp thoại, nút bấm để tạo chất Cartoon. |
| **Bóng Đổ Khối Cứng (Hard Shadow 3D)** | `0 4px 0 #0F172A` | Đổ bóng nổi khối cho nút và thẻ bài (lún xuống 1px khi bấm). |
| **Lớp Phản Chiếu Bóng Gương (Glossy)**  | `linear-gradient(rgba(255,255,255,0.45), transparent)` | Tạo độ bóng bẩy như kẹo ngọt hoặc đồ chơi bằng nhựa cao cấp. |

### 3. Hệ thống Typography (Kiểu chữ)
* **Font Tiêu Đề, Tỷ Số, Tên Đội:** **`Nunito`** (hoặc `Baloo 2`) – Font chữ bo tròn mập mạp, vui nhộn, đậm chất game 2D, viền nét đen dày tạo độ nổi.
* **Font Nội Dung, Câu Hỏi, Đáp Án:** **`Be Vietnam Pro`** (hoặc `Inter`) – Đảm bảo dấu tiếng Việt sắc nét, rõ ràng trên mọi thiết bị di động, tránh mỏi mắt cho thí sinh.

---

## 🎨 II. CHI TIẾT THIẾT KẾ CÁC THÀNH PHẦN GIAO DIỆN

```
+-------------------------------------------------------------------------+
| [⚡ KÉO CO TRI THỨC]  TRẠM 1: THỬ THÁCH SỐ        [ÂM THANH: 🔊] [THOÁT]|
+-------------------------------------------------------------------------+
|  +-------------------+                      +-------------------+       |
|  | ĐỘI A - TIA CHỚP  |      [ 7 - 5 ]       | ĐỘI B - NGỌN LỬA  |       |
|  |  (Xanh Lam Sáng)  |    MỤC TIÊU: 10      |   (Cam Lửa Rực)   |       |
|  +-------------------+                      +-------------------+       |
|                                                                         |
|        🧑‍💻🧑‍💻🧑‍💻 ══════════════ 🚩 ══════════════ 🦹🦹🦹         |
|         (Kéo về trái)      [RANH GIỚI]      (Kéo về phải)               |
+-------------------------------------------------------------------------+
|  [IT - AN NINH MẠNG]         [⏱️ CÒN 08s]           [🎯 CÂU 05/15]      |
|  "Giao thức mạng nào sau đây được sử dụng để truyền tải web an toàn?"    |
+-------------------------------------------------------------------------+
|  +--------------------------------+  +--------------------------------+ |
|  | [⚪ A] HTTP                🔒 |  | [🔺 B] HTTPS               🔒 | |
|  +--------------------------------+  +--------------------------------+ |
|  +--------------------------------+  +--------------------------------+ |
|  | [⏹️ C] FTP                 🔒 |  | [🔶 D] SMTP                🔒 | |
|  +--------------------------------+  +--------------------------------+ |
|                                                                         |
|           [ 🔔 BẤM CHUÔNG ĐỂ GIÀNH QUYỀN TRẢ LỜI 🔔 ]                   |
|        (Nút chuông vàng khổng lồ 3D - Nhún nảy theo nhịp thở)           |
+-------------------------------------------------------------------------+
```

---

### 1. Tầng 1: Đấu Trường Kéo Co 2D (TugOfWarArena & Characters)
* **Nhân vật kéo co Vector 2D:**
  * Thay thế bóng mờ bằng các nhân vật hoạt hình Chibi 2D dí dỏm:
    * **Đội A (Áo xanh cyan, đeo tai nghe IT, tóc vuốt năng động).**
    * **Đội B (Áo cam rực lửa, phong cách hacker bí ẩn / nhiệt huyết).**
  * **Biểu cảm biến đổi theo tình huống:**
    * *Đang hòa:* Cả hai bên nghiến răng kéo cân tài cân sức.
    * *Bị kéo lùi:* Mặt toát mồ hôi hột, chân trượt dài tạo vệt bụi hoạt hình.
    * *Đang dẫn trước:* Cười tươi tắn, cơ bắp cuồn cuộn giật mạnh dây thừng.
* **Dây thừng hoạt hình:**
  * Dây xoắn thừng màu nâu đất viền đen cartoon dày dặn.
  * Nơ đỏ buộc giữa trung tâm đung đưa theo gia tốc giật dây.
  * Vạch ranh giới kẻ sọc vàng-đen hoặc vạch cờ ca-rô thể thao.
* **Bảng điểm Toy-Box (Scoreboard):**
  * Hộp điểm màu xanh dương đậm viền đen bóng bẩy ở chính giữa đỉnh màn hình.
  * Số điểm hiển thị cỡ lớn hiệu ứng lật thẻ (Score Flip) hoặc nảy nở (Scale Bounce) mỗi khi ghi điểm.

---

### 2. Tầng 2: Khung Câu Hỏi & Đồng Hồ Hoạt Hình (QuestionBox & RingTimer)
* **Khung câu hỏi phong cách Bảng Nhiệm Vụ (Mission Board):**
  * Bo góc lớn `rounded-2xl`, viền đen dày `border-3 border-[#0F172A]`, nền xanh nhạt viền viền màu xanh dương công nghệ `#2563EB`.
  * Có nhãn dán sticker phong cách hoạt hình:
    * `[💻 IT - CÔNG NGHỆ THÔNG TIN]` (Sticker xanh ngọc).
    * `[⚖️ PHÁP LUẬT ĐỜI SỐNG]` (Sticker tím lavender).
  * Góc thẻ hơi nghiêng nhẹ `-1deg` tạo cảm giác vui mắt, tự nhiên.
* **Đồng hồ tròn hoạt hình (Comic Timer):**
  * Tạo hình giống quả chuông đồng hồ báo thức hoặc mặt bom hẹn giờ hoạt hình.
  * Kim quét hoặc vòng tròn đếm ngược:
    * `> 5 giây:` Vòng tròn màu xanh dương rực rỡ.
    * `3 - 5 giây:` Đổi sang màu vàng cam báo hiệu gấp rút.
    * `< 3 giây:` Đổi sang đỏ chớp nháy kèm hiệu ứng rung lắc (Screen shake / Heartbeat pulse).

---

### 3. Tầng 3: Bàn Phím Chuông Vàng & 4 Đáp Án Thẻ Bài (Buzzer & Answer Cards)
* **Nút bấm chuông thần thánh (Giant 3D Golden Bell):**
  * Nằm ở trung tâm nửa dưới màn hình để cả hai đội hoặc người cầm máy thuận tiện đập tay cực nhanh.
  * Thiết kế hình vòm tròn 3D màu vàng hổ phách, bóng đổ sâu `shadow-[0_8px_0_#B45309]`.
  * Khi nhấn: Chuông lún sâu xuống `translate-y-2` phát ra sóng xung kích tròn bung ra (Shockwave animation) và tiếng *“BOING! / DING-DONG!”* đanh thép.
* **4 Khung đáp án dạng Thẻ Bài Comic (A, B, C, D):**
  * **Trạng thái Khóa 🔒:** Thẻ bài có màu xám xanh trung tính, biểu tượng ổ khóa hoạt hình 🔒 lắc lư nhẹ.
  * **Trạng thái Mở khóa:** Khi đội nào bấm chuông thành công, 4 thẻ bài bừng sáng với viền màu của đội đó (Xanh cho Đội A, Cam cho Đội B).
  * **Trạng thái Trả lời Đúng:** Thẻ bài nảy lên, viền xanh lá `#22C55E` viền vàng hào quang, bắn pháo giấy mini.
  * **Trạng thái Trả lời Sai:** Rung bần bật (Shake), gạch chéo đỏ `❌`, ổ khóa khóa chặt lại và chuyển quyền cướp điểm cho đội bạn.

---

### 4. Hệ Thống Âm Thanh & Hiệu Ứng Phản Hồi (Audio & Micro-Interactions)
* **Âm thanh hoạt hình (Retro Game SFX):**
  * *Nhạc nền (BGM):* Giai điệu điện tử tiết tấu nhanh, vui nhộn, tạo không khí hừng hực của ngày hội sinh viên.
  * *Bấm chuông:* m thanh chuông cơ học vang rộn ràng.
  * *Đúng điểm:* Âm thanh *ting ting* vỗ tay kèm tiếng còi cổ vũ.
  * *Sai điểm:* m thanh tò te vui nhộn kiểu hoạt hình Tom & Jerry.
  * *Tiếng kéo dây thừng:* Tiếng "Dô ta kéo!" giật dây dứt khoát.
* **Pháo hoa chiến thắng (Victory Celebration):**
  * Sử dụng `canvas-confetti` bắn pháo rực rỡ phủ kín màn hình.
  * Cúp vàng 2D Chibi nảy tưng bừng ở giữa với hiệu ứng tia nắng xoay tròn phía sau (Sunburst ray animation).

---

## 📅 III. LỘ TRÌNH TRIỂN KHAI CHI TIẾT (5 GIAI ĐOẠN)

### Giai đoạn 1: Chuẩn bị Asset & Xây dựng Design Tokens Mới (Ngày 1)
- [ ] Nhập các font chữ Google: **Nunito** (700, 800, 900) và **Be Vietnam Pro** (500, 600, 700) vào [index.html](file:///d:/KEOCOTRITHUC/src/frontend/index.html).
- [ ] Cập nhật bảng màu CSS Variables trong [index.css](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css):
  - Thiết lập bảng màu Xanh dương chủ đạo, màu nền kem tuyết `#F0F7FF`, màu viền hoạt hình `#0F172A`.
  - Tạo các class tiện ích 3D: `.btn-comic-3d`, `.card-comic-2d`, `.badge-sticker`, `.glossy-overlay`.
- [ ] Bổ sung các file âm thanh hiệu ứng game (BGM vui nhộn, Chuông đanh, Kéo dây, Đúng, Sai, Còi chiến thắng).

### Giai đoạn 2: Redesign Vũ Đài Kéo Co & Nhân Vật 2D (Ngày 2)
- [ ] Nâng cấp [TugOfWarArena.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx):
  - Chuyển đổi nền đấu trường sang phong cách sân vận động hoạt hình / thảm thi đấu thể thao xanh dương.
  - Làm lại bảng điểm trung tâm kiểu khối hộp đồ chơi (Toy-box Scoreboard).
- [ ] Tái thiết kế [PullerCharacter.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/PullerCharacter.jsx):
  - Vẽ lại các chiến binh hoạt hình Chibi 2D bằng SVG tối ưu hiệu năng: Đội A (Xanh Cyan) & Đội B (Cam Lửa).
  - Thêm hiệu ứng gồng mình, toát mồ hôi và vệt khói trượt chân khi kéo dây.

### Giai đoạn 3: Redesign Khung Câu Hỏi & Hệ Thống Chuông / Đáp Án (Ngày 3)
- [ ] Nâng cấp [QuestionBox.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/QuestionBox.jsx):
  - Tạo khung câu hỏi dạng bảng nhiệm vụ comic viền đen đậm, bo góc tròn xoe.
  - Thêm sticker thể loại câu hỏi `[IT]` và `[PHÁP LUẬT]` có bóng đổ 3D.
- [ ] Nâng cấp [RingTimer.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/RingTimer.jsx):
  - Tạo hình đồng hồ báo thức hoạt hình với hiệu ứng nhịp tim rung giật khi đếm ngược dưới 3s.
- [ ] Nâng cấp [BuzzerControl.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx):
  - Biến nút bấm chuông thành "Nút Khổng Lồ 3D Vàng Óng", lún sâu khi ấn và tỏa sóng xung kích.
  - Thiết kế 4 thẻ đáp án dạng thẻ bài hoạt hình viền đen dày, có ổ khóa 🔒 lắc lư ngộ nghĩnh.

### Giai đoạn 4: Redesign Các Lớp Phủ & Màn Hình Kết Thúc (Ngày 4)
- [ ] Nâng cấp [FeedbackOverlay.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/FeedbackOverlay.jsx):
  - Popup kết quả dạng bong bóng truyện tranh (Comic speech bubble): *"CHÍNH XÁC! +1 ĐIỂM 🎉"*, *"TRẢ LỜI SAI! CƯỚP ĐIỂM! ⚠️"*.
- [ ] Nâng cấp [VictoryModal.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryModal.jsx) & [VictoryCutscene.jsx](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryCutscene.jsx):
  - Cúp vô địch vàng 2D Chibi cỡ lớn, nhân vật đội thắng nhảy múa ăn mừng, đội thua ngồi thở phào vui vẻ.
  - Bắn pháo giấy confetti toàn màn hình.

### Giai đoạn 5: Tinh Chỉnh Responsive & Kiểm Thử Trải Nghiệm (Ngày 5)
- [ ] Tối ưu hiển thị hoàn hảo trên các màn hình di động phổ biến (iPhone, Samsung, Xiaomi) từ tỉ lệ 16:9 đến 20:9.
- [ ] Đảm bảo thao tác chạm (Touch) cực nhạy, không bị trễ hay lag (Zero Latency Tap).
- [ ] Kiểm tra độ tương phản màu sắc để màn hình điện thoại ngoài trời gian hàng vẫn thấy rõ mồn một.

---

## 🎯 IV. TIÊU CHUẨN ĐÁNH GIÁ THÀNH CÔNG (KPIs)
1. **Ấn tượng thị giác (Visual WOW Factor):** Giao diện ngay từ giây đầu tiên nhìn như một tựa game mobile 2D chuyên nghiệp (như *Case Hunter*, *Brawl Stars* hay *Đội Điều Tra Số*), sinh viên đi qua nhìn vào là muốn bấm thử ngay.
2. **Đồng nhất thương hiệu:** Sắc xanh dương công nghệ giữ vai trò linh hồn xuyên suốt, kết hợp hài hòa với màu nhận diện Đội A (Cyan) và Đội B (Cam).
3. **Mượt mà 60 FPS:** Toàn bộ chuyển động kéo dây, bấm chuông, mở thẻ bài hoạt động trơn tru không giật khung hình.
4. **Trực quan dễ hiểu:** Sinh viên không cần hướng dẫn nhiều, nhìn vào nút chuông vàng khổng lồ và 4 ô đáp án là biết ngay cách chơi.
