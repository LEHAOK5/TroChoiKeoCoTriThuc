# 🎨 THIẾT KẾ, MÀU SẮC CHỦ ĐẠO & QUY CHUẨN GIAO DIỆN

## 1. Màu Sắc Nhận Diện Thương Hiệu (Brand Identity)

Dự án tuân thủ nghiêm ngặt bảng màu nhận diện **HARMONY** của Trường Đại học Văn Hiến (VHU):

| Thành phần | Mã Hex | Giá trị CMYK | Ý nghĩa & Vị trí sử dụng |
| :--- | :--- | :--- | :--- |
| **Màu Chủ Đạo (Primary)** | `#1A1AFF` | **100 65 0 0** | Màu nhận diện thương hiệu VHU, màu nền ngoài thuần phẳng 100% (Solid Color) cho toàn bộ Web App trên Mobile và Laptop, Đội A (Tia Chớp ⚡), các nút bấm hành động chính. |
| **Dải Gradient Chủ Đạo** | `linear-gradient(180deg, #101077 0%, #1A1AFF 50%, #0D0D99 100%)` | — | Dùng cho nền khung hình chiến thắng, khung hình nhà tù đội thua, thanh tiêu đề lớn. |
| **Màu Đối Kháng (Opponent)**| `#EA580C` / `#FF5722` | — | Màu nhận diện Đội B (Ngọn Lửa 🔥), tạo sự tương phản mạnh mẽ với Đội A trên sân đấu. |
| **Vàng Vinh Quang (Gold)** | `#FACC15` / `#EAB308` | — | Nút bấm chuông vàng 3D, cúp vô địch, bục vinh quang số 1, thẻ quà tặng trạm 2. |
| **Viền Đen Hoạt Hình (Stroke)** | `#000000` / `#0F172A` | — | Đường nét vẽ viền đen dày (2px - 3.5px) cho toàn bộ nhân vật chibi, khung thẻ, nút bấm. |
| **Nền Đấu Trường Cỏ 2D** | `linear-gradient(180deg, #166534 0%, #15803D 50%, #14532D 100%)` | — | Màu sân cỏ thi đấu kéo co thể thao. |

---

## 2. Phong Cách Thiết Kế: 2D Manga Neo-Brutalism
- **Độ nổi khối xúc giác (Tactile 3D Buttons):** Nút bấm có bóng đổ cứng (`box-shadow: 0 4px 0 #000`), khi nhấn sẽ lún xuống (`transform: translateY(2px)`), tạo cảm giác như bàn phím cơ và máy game Arcade.
- **Nhân vật Chibi vẽ tay thuần SVG:** Nhân vật không dùng ảnh bitmap nặng nề mà dựng 100% bằng SVG vector, sắc nét tuyệt đối trên mọi độ phân giải màn hình từ iPhone đến màn hình chiếu LED 4K.
- **Biểu cảm hoạt hình cường điệu:**
  - Khi kéo: Ngả người 25-32 độ, toát mồ hôi, đám mây bụi `💨`, bóng thoại hô hào.
  - Khi thắng: Nhảy cẫng ăn mừng, giơ tay chữ V, nâng cúp, tung hoa giấy.
  - Khi thua: Mắt xoáy ốc choáng váng, nước mắt phun trào kiểu anime, áo tù sọc ngang khóc ròng.

---

## 3. Hệ Thống Typography (Phông Chữ)
- **Font Tiêu đề & Điểm số:** `Baloo 2` hoặc `var(--font-title)` (bo tròn mập mạp, viền nét đen dày tạo độ nổi pop-up).
- **Font Nội dung & Câu hỏi:** `Be Vietnam Pro` hoặc `Inter` (rõ ràng, tối ưu hiển thị dấu tiếng Việt, dễ đọc trên di động).

---

## 4. Quy Chuẩn Responsive Mobile vs Laptop (Tối Quan Trọng)

> [!IMPORTANT]
> **Quy tắc bất di bất dịch:** Toàn bộ màn hình thi đấu và các bảng thông báo kết thúc trận **phải luôn nằm trọn trong chiều cao màn hình điện thoại (Viewport Height)**, tuyệt đối không được để nút "CHƠI LẠI TRẬN MỚI" hoặc các nút hành động bị tràn xuống đáy màn hình phải cuộn trang.

- **Trên Mobile (`width < 640px`):**
  - Tự động kích hoạt chế độ `isCompact={true}` cho các khung hình.
  - Khung đấu trường Chibi co tỉ lệ `scale(0.68)`, độ rộng tối đa `420px`.
  - Icon cúp thu nhỏ `2.8rem`, tiêu đề gọn `1.25rem`.
- **Trên Laptop/Desktop (`width >= 640px`):**
  - Kích hoạt chế độ `isCompact={false}`, mở rộng tối đa `560px` - `920px`, chữ và nhân vật hiển thị rộng rãi, thoáng mắt.
