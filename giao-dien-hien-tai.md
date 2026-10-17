# BẢN THIẾT KẾ & MIÊU TẢ GIAO DIỆN HIỆN TẠI
# WEB APP GAME: KÉO CO TRI THỨC (PHIÊN BẢN 2.0)

> **Mục đích:** Tài liệu khảo sát hiện trạng giao diện người dùng (UI/UX), sơ đồ Wireframe chi tiết 4 màn hình, phân tích ưu nhược điểm và định hướng nâng cấp thẩm mỹ "Neo-Arcade Tactile Glass" tạo hiệu ứng thị giác đỉnh cao (WOW factor).  
> **File Word đính kèm:** [`giao-dien-hien-tai.docx`](file:///d:/KEOCOTRITHUC/giao-dien-hien-tai.docx) (Đã xuất bản thành công)  
> **Ngày cập nhật:** 17/10/2026  

---

## 🎨 1. TỔNG QUAN HỆ THỐNG GIAO DIỆN (DESIGN SYSTEM)

* **Phong cách chủ đạo:** **Neo-Arcade Tactile Glass** (Kết hợp game arcade hoài niệm với phong cách kính mờ hiện đại).
* **Bảng màu tương phản cao (High-contrast Cyber Palette):**
  - **Nền chính (Deep Space Canvas):** `#0B132B` (Xanh đen vũ trụ sang trọng, chống chói mắt).
  - **Đội A (⚡ Tia Chớp - Neon Cyan):** `#00F0FF` kết hợp hiệu ứng phát sáng `box-shadow: 0 0 20px rgba(0, 240, 255, 0.4)`.
  - **Đội B (🔥 Ngọn Lửa - Blaze Orange):** `#FF6B00` kết hợp hiệu ứng rực lửa `box-shadow: 0 0 20px rgba(255, 107, 0, 0.4)`.
  - **Nút Chuông & Điểm Cướp (Gold Buzzer):** `#FFD600` đến `#FF9900` (Vàng kim hoàng gia).
* **Trải nghiệm xúc giác (Tactile 3D Feel):**
  - Nút bấm có độ dày vật lý (3D bevel), khi nhấn xuống tạo cảm giác lún sâu `transform: translateY(3px)`.
  - Hỗ trợ rung phản hồi xúc giác (**Haptic Vibration API**) khi bấm chuông hoặc chọn đáp án trên điện thoại.

---

## 📱 2. CHI TIẾT CẤU TRÚC & WIREFRAME 4 MÀN HÌNH CHÍNH

### 2.1. Màn Hình 1: Đăng Ký Sinh Viên & Chọn Đội (`RegisterPage.jsx`)
* **Mục đích:** Sinh viên quét mã QR tại quầy để tự động nhận mã phòng, điền thông tin và chọn đội.

```text
+-----------------------------------------------------------------------+
|  ⚔️ KÉO CO TRI THỨC           [Trạm 1: Thử Thách Trí Tuệ]      🏛️ BTC |
+-----------------------------------------------------------------------+
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |                  🏆 THAM GIA ĐẤU TRƯỜNG KÉO CO                |   |
|   |         Quét mã tại quầy hoặc nhập mã phòng do BTC cấp        |   |
|   +---------------------------------------------------------------+   |
|   |  MÃ PHÒNG ĐẤU:  [ #1234 ]   [✅ Phòng 1234 hợp lệ (Chế độ 2vs2)]   |   |
|   |  HỌ VÀ TÊN:     [ Nguyễn Văn A                            ]   |   |
|   |  MÃ SỐ SV:      [ 231A010369                              ]   |   |
|   |  SỐ ĐIỆN THOẠI: [ 0912345678                              ]   |   |
|   |  KHOA / VIỆN:   [ CNTT & Khoa học Dữ liệu                 ]   |   |
|   +---------------------------------------------------------------+   |
|   |  CHỌN ĐỘI THI ĐẤU:                                            |   |
|   |  [ ⚡ ĐỘI A - TIA CHỚP ]             [ 🔥 ĐỘI B - NGỌN LỬA ]   |   |
|   |  [   (1/2 thành viên)  ]             [    (🔒 ĐÃ ĐỦ 2/2)   ]   |   |
|   +---------------------------------------------------------------+   |
|   |                 [ 🚀 VÀO PHÒNG THI ĐẤU NGAY ]                 |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
|             Trang quản trị dành cho Ban tổ chức (Tạo phòng) 🔒         |
+-----------------------------------------------------------------------+
```

---

### 2.2. Màn Hình 2: Sảnh Chờ Đồng Bộ Real-time (`LobbyPage.jsx`)
* **Mục đích:** Màn hình tập hợp cả 2 đội (1vs1 -> 5vs5), hiển thị trạng thái Sẵn sàng của từng người.

```text
+-----------------------------------------------------------------------+
| 👋 Lê Nhựt Hào (231A010369)   [🚪 Rời phòng]   PHÒNG #1234   2vs2     |
+-----------------------------------------------------------------------+
| 👥 Đã vào phòng: 4/4 người  •  Sẵn sàng: 3/4 người ⏳                  |
+-----------------------------------------------------------------------+
| [ ⚡ ĐỘI A - TIA CHỚP (2/2) ]         [ 🔥 ĐỘI B - NGỌN LỬA (2/2) ]  |
| [  BẠN ĐANG Ở ĐỘI A ✅      ]         [  ĐỘI B ĐÃ ĐỦ NGƯỜI        ]  |
+---------------------------------------+-------------------------------+
| THÀNH VIÊN ĐỘI A:                     | THÀNH VIÊN ĐỘI B:             |
| 👤 Lê Nhựt Hào (Bạn)   ✅ SẴN SÀNG     | 👤 Nguyễn Minh Hiếu ✅ SẴN SÀNG|
| 👤 Lương Thị Thanh     ✅ SẴN SÀNG     | 👤 Trương Hoàng Tiến  ⏳ CHỜ   |
+---------------------------------------+-------------------------------+
|             [ 🚀 BẤM SẴN SÀNG THI ĐẤU (BẠN ĐÃ SẴN SÀNG) ]             |
|       Trận đấu bắt đầu khi đủ 4/4 người sẵn sàng (hoặc BTC bấm)!      |
+-----------------------------------------------------------------------+
```

---

### 2.3. Màn Hình 3: Vũ Đài Thi Đấu Kéo Co (`GamePage.jsx` - Trọng Tâm Trận Đấu)
* **Mục đích:** Vũ đài so tài kiến thức IT và Luật với bố cục 3 tầng, đáp án mở khóa trực tiếp.

```text
+-----------------------------------------------------------------------+
| ⚔️ KÉO CO TRI THỨC              ⚡ ĐỘI A    🚪 Thoát    🏛️ BTC    ● 1ms|
+-----------------------------------------------------------------------+
| [TẦNG 1: VŨ ĐÀI KÉO CO & TỶ SỐ REAL-TIME (35%)]                       |
|   ⚡ ĐỘI A: 6 điểm                  RANH GIỚI         🔥 ĐỘI B: 8 điểm |
|   💪⚡💻 =====[ DÂY THỪNG ]==== [🚩 CỜ ĐỎ] ====[ DÂY THỪNG ]==== 👨‍💼🔥⚖️|
+-----------------------------------------------------------------------+
| [TẦNG 2: CÂU HỎI TRẮC NGHIỆM IT / PHÁP LUẬT (25%)]                    |
|   [⚖️ PHÁP LUẬT ĐỜI SỐNG]                   CÂU 25 / 25     ⏱️ 12s     |
|   Theo Luật An ninh mạng 2018, hành vi nào sau đây là bị              |
|   nghiêm cấm trên không gian mạng?                                    |
+-----------------------------------------------------------------------+
| [TẦNG 3: VÙNG TƯƠNG TÁC NGÓN CÁI - ĐÁP ÁN MỞ KHÓA TRỰC TIẾP (40%)]    |
|                                                                       |
|   * GIAI ĐOẠN 1: CHỜ BẤM CHUÔNG (15 GIÂY)                             |
|   📖 4 phương án trả lời (Trạng thái Khóa 🔒):                        |
|   +-------------------------------+-------------------------------+   |
|   | ⚪ A. Đăng tải thông tin sai 🔒| 🔺 B. Sử dụng phần mềm diệt 🔒|   |
|   +-------------------------------+-------------------------------+   |
|   | ⏹️ C. Thay đổi mật khẩu định 🔒| 🔶 D. Sao lưu dữ liệu định  🔒|   |
|   +-------------------------------+-------------------------------+   |
|                                                                       |
|                 [ 🔔 BẤM CHUÔNG ĐỂ MỞ KHÓA TRẢ LỜI ]                  |
|                                                                       |
|   -----------------------------------------------------------------   |
|   * GIAI ĐOẠN 2: ĐỘI MÌNH BẤM ĐƯỢC CHUÔNG (10 GIÂY)                   |
|   ⚡ BẠN ĐÃ GIÀNH QUYỀN TRẢ LỜI! CHỌN 1 TRONG 4 ĐÁP ÁN DƯỚI ĐÂY: ⏱️ 9s |
|   +-------------------------------+-------------------------------+   |
|   | ⚪ A. Đăng tải thông tin sai ✨| 🔺 B. Sử dụng phần mềm diệt ✨|   |
|   +-------------------------------+-------------------------------+   |
|   | ⏹️ C. Thay đổi mật khẩu định ✨| 🔶 D. Sao lưu dữ liệu định  ✨|   |
|   +-------------------------------+-------------------------------+   |
|   (Bấm chọn trực tiếp vào ô đáp án - Viền Neon Cyan phát sáng rực rỡ) |
|                                                                       |
|   -----------------------------------------------------------------   |
|   * GIAI ĐOẠN 3: ĐỐI THỦ CHỌN SAI -> CƠ HỘI CƯỚP ĐIỂM (8 GIÂY)        |
|   ⚡ CƠ HỘI CƯỚP ĐIỂM CHO ĐỘI BẠN!                               ⏱️ 7s |
|   +-------------------------------+-------------------------------+   |
|   | ⚪ A. Đăng tải thông tin sai ✨| ❌ B. [ĐỐI THỦ CHỌN SAI - ❌] |   |
|   +-------------------------------+-------------------------------+   |
|   | ⏹️ C. Thay đổi mật khẩu định ✨| 🔶 D. Sao lưu dữ liệu định  ✨|   |
|   +-------------------------------+-------------------------------+   |
+-----------------------------------------------------------------------+
```

---

### 2.4. Màn Hình 4: Bảng Điều Khiển Ban Tổ Chức (`AdminPage.jsx`)
* **Mục đích:** Cho phép CTV trực trạm tạo phòng, chiếu mã QR, kiểm tra trạng thái và điều phối trận đấu.

```text
+-----------------------------------------------------------------------+
| 🏛️ BẢNG ĐIỀU KHIỂN BAN TỔ CHỨC      [Ca trực: admin]       [Đăng xuất] |
+-----------------------------------------------------------------------+
| 📊 THỐNG KÊ GIAN HÀNG:                                                |
|   [ 👥 45 Sinh viên đăng ký ]  [ 🏆 18 Trận đấu ]  [ 🎮 2 Bàn đang mở ]|
+-----------------------------------------------------------------------+
| ➕ MỞ BÀN THI ĐẤU MỚI:                                                |
|   Chế độ:  ( ) 1v1    (*) 2v2    ( ) 3v3    ( ) 4v4    ( ) 5v5         |
|   Mã phòng tùy chọn: [      ] (Để trống sẽ sinh ngẫu nhiên 4 chữ số)  |
|   [ 🚀 TẠO PHÒNG ĐẤU NGAY ]                                           |
+-----------------------------------------------------------------------+
| 🎮 DANH SÁCH BÀN ĐẤU ĐANG HOẠT ĐỘNG:                                 |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   | #1234  Chế độ: 2vs2 (2 vs 2)       [ ⏳ ĐỢI SẴN SÀNG (3/4) ]   |   |
|   | [📱 Mã QR quét]   [⏳ Đợi sẵn sàng (3/4)]   [🔄 Đón lượt mới]   |   |
|   +---------------------------------------------------------------+   |
|   | ĐỘI A (TIA CHỚP): 2/2 người    | ĐỘI B (NGỌN LỬA): 2/2 người  |   |
|   | 👤 Lê Nhựt Hào   ✅ SẴN SÀNG    | 👤 Nguyễn Minh Hiếu ✅ SẴN    |   |
|   | 👤 Lương T.Thanh ✅ SẴN SÀNG    | 👤 Trương Hoàng Tiến ⏳ CHỜ   |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

---

## 💎 3. BẢNG SO SÁNH & ĐỀ XUẤT CẢI TIẾN THẨM MỸ (WOW FACTOR)

| Khu Vực | Hiện Trạng Đang Có | Đề Xuất Cải Tiến Đỉnh Cao (State of the art) | Mức Độ WOW |
| :--- | :--- | :--- | :---: |
| **1. Vũ đài Kéo co (Tầng 1)** | Dây thừng có vạch cờ đỏ di chuyển mượt mà, 2 icon lực sĩ hai bên. | **Thêm hiệu ứng giật nảy màn hình (Screen Shake)** khi ghi điểm, tia lửa điện xẹt qua dây thừng, hiệu ứng khói bụi bốc lên dưới chân nhân vật. | ⭐⭐⭐⭐⭐ |
| **2. Khung 4 Đáp Án (Tầng 3)** | Đã gộp thành 1 hàng duy nhất, mở khóa trực tiếp viền màu khi bấm chuông. | **Thêm viền Gradient Neon động (Cyber Flow Border)** xoay vòng quanh đáp án được mở khóa; hiệu ứng sóng xung kích lan tỏa khi chạm tay vào đáp án. | ⭐⭐⭐⭐⭐ |
| **3. Nút Bấm Chuông (Buzzer)** | Nút chuông vàng tròn/dài nổi 3D, hiệu ứng nhịp thở Pulse. | **Thêm đồng hồ vòng tròn quét 360° (SVG Circular Progress)** đếm ngược 15s ôm sát nút chuông; hiệu ứng nổ pháo hạt ánh sáng khi chạm chuông. | ⭐⭐⭐⭐⭐ |
| **4. Sảnh Chờ (Lobby)** | Danh sách người chơi hiển thị dạng bảng text kính mờ. | **Bổ sung Avatar Chibi đại diện phong cách Gamer** cho từng bạn sinh viên; thêm hiệu ứng tia sét đối đầu chia cắt giữa Đội A và Đội B. | ⭐⭐⭐⭐ |
| **5. Màn hình Chiếu (Projector)** | Màn hình Admin quản trị thông thường. | **Thêm chế độ "Màn hình Trình Chiếu Gian Hàng" (Projector Big Screen Mode):** Hiển thị trận đấu toàn màn hình không có thanh công cụ để chiếu lên Tivi/LED thu hút sinh viên từ xa. | ⭐⭐⭐⭐⭐ |

---

## 🚀 4. ĐỊNH HƯỚNG BƯỚC TIẾP THEO

Bạn hãy xem qua bản miêu tả và chọn hạng mục bạn muốn tôi bắt tay vào chỉnh sửa để làm đẹp giao diện ngay bây giờ:
1. **Lựa chọn A:** Nâng cấp **Vũ đài Kéo co & Hiệu ứng giật dây** (thêm tia lửa điện, bụi đất, rung màn hình khi giật dây).
2. **Lựa chọn B:** Nâng cấp **Thẻ 4 Đáp án & Nút Chuông Vàng** (viền Cyber Neon động, vòng tròn đếm ngược quét xung quanh chuông).
3. **Lựa chọn C:** Nâng cấp **Sảnh chờ thi đấu** (Avatar Chibi sinh viên, hoạt ảnh đối đầu hoành tráng).
4. **Lựa chọn D:** Bổ sung **Giao diện Màn hình Máy chiếu (Projector Display Mode)** cho gian hàng.
