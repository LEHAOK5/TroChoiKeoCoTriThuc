# 🧩 CHI TIẾT CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH

Tài liệu này liệt kê chi tiết từng tính năng đã hoàn thiện trong mã nguồn để tránh việc lập trình viên hoặc AI viết trùng lặp hoặc làm hỏng chức năng đang hoạt động.

---

## 1. Đấu Trường Kéo Co 5vs5 (`TugOfWarArena.jsx`)
- **Tập tin:** [`src/frontend/src/components/TugOfWarArena.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx)
- **10 Nhân vật Chibi thi đấu đồng thời:** 5 bạn Đội A (áo xanh) đối đầu 5 bạn Đội B (áo cam). Đan xen 3 Nam, 2 Nữ mỗi đội.
- **Sợi dây và Nơ cờ đỏ động lực học:**
  - Nơ cờ đỏ di chuyển rõ rệt theo chênh lệch điểm số: `baseStepPx = 6.5px` (mobile) hoặc `13px` (desktop) cho mỗi điểm dẫn trước.
  - **Xung lực kéo tức thì (Impulse Jerk 2.5s):** Khi một đội trả lời đúng, nơ dây và sợi dây lập tức giật mạnh về phía đội ghi điểm (`impulseShift: ±8px / ±14px`), kết hợp hiệu ứng nảy `cubic-bezier(0.34, 1.56, 0.64, 1)`.
  - Đám mây bụi `💨` và bóng thoại hành động `⚡ DÔ TA! KÉO!` bung ra sống động.
- **Vạch năng lượng 10 khấc (10-Notch Energy Bar):** Hiển thị trực quan số điểm mỗi đội đã đạt được từ 0 đến 10.

---

## 2. Nhân Vật Trọng Tài: Vị Thẩm Phán Tri Thức (`RefereeCharacter.jsx`)
- **Tập tin:** [`src/frontend/src/components/RefereeCharacter.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/RefereeCharacter.jsx)
- **Tạo hình:** Thay thế trọng tài còi truyền thống bằng **Vị Thẩm Phán Tri Thức** với áo thụng đen, cổ trắng pháp đình, tóc giả xoăn trắng phong cách Châu Âu cổ điển, kính mắt vàng trí tuệ và tay cầm búa công lý gỗ sồi.
- **Hành vi thông minh:**
  - Mắt chuyển động liếc nhìn theo vị trí nơ cờ đỏ của sợi dây.
  - Khi có đội bấm chuông hoặc trả lời đúng: Gõ búa xuống bàn kèm hiệu ứng âm thanh và ngôi sao vàng lấp lánh `✨`.

---

## 3. Màn Kéo Phăng Ngã Đối Thủ (`VictoryCutscene.jsx`)
- **Tập tin:** [`src/frontend/src/components/VictoryCutscene.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryCutscene.jsx)
- **Cơ chế 2 giai đoạn (2-Phases Cutscene - 4.2 giây):**
  - **Phase 1 (PULL - 0s đến 1.8s):** Dồn lực kéo quyết định, hai đội giằng co nghẹt thở, tia sáng xoay Sunburst nền.
  - **Phase 2 (FALL - 1.8s đến 4.2s):** Tiếng còi vang lên, đội thắng kéo phăng sợi dây, đội thua ngã nhào trên sân cỏ với bóng thoại hài hước: *"Úi giời ơi té rồi!"* / *"Oái mất đà rồi!"*.
  - Sân đấu sạch sẽ, hoàn toàn không bị lồng ghép song sắt nhà tù sớm, giữ trọn vẹn sự kịch tính của màn đấu thể thao. Có nút "Bỏ qua Cutscene ⏩" cho người chơi muốn xem ngay kết quả.

---

## 4. Màn Kết Quả Phân Hóa Tự Động Theo Đội (`VictoryModal.jsx`)
- **Tập tin:** [`src/frontend/src/components/VictoryModal.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryModal.jsx)
- Tự động nhận diện thiết bị người chơi thuộc đội nào (`player.team`) để hiển thị khung hình riêng mà **không cần nút chuyển đổi thủ công**:

### 🏆 Giao diện dành cho Đội Thắng (`WinnerCelebrationBox.jsx`)
- **Tập tin:** [`src/frontend/src/components/WinnerCelebrationBox.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/WinnerCelebrationBox.jsx)
- **Nền chủ đạo:** Gradient xanh dương HARMONY `#1A1AFF` rực rỡ kết hợp hào quang vàng kim.
- **Bục số 1 vinh quang dát vàng 3D:** Có gờ thềm vàng sáng, hiển thị ngay ngắn dòng chữ **`🏆 #1 VÔ ĐỊCH`** trên 1 dòng duy nhất, không bị che khuất.
- **3 Nhân vật Chibi ăn mừng:**
  - Nhân vật đội trưởng đứng hiên ngang **trên bề mặt bục số 1**, tay giơ cao cúp vàng vô địch.
  - Hai đồng đội bên cạnh đeo huy chương vàng và giơ ngón tay chữ V ăn mừng.
  - Mưa pháo hoa giấy (confetti) bắn ngập tràn màn hình.

### 👮‍♂️ Giao diện dành cho Đội Thua (`JailCellMemeBox.jsx`)
- **Tập tin:** [`src/frontend/src/components/JailCellMemeBox.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/JailCellMemeBox.jsx) & [`PoliceOfficerCharacter.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/PoliceOfficerCharacter.jsx)
- **Nền chủ đạo:** Đồng bộ 100% với màu xanh HARMONY `#1A1AFF`, kết hợp ánh sáng đèn spotlight rọi từ trần phòng giam.
- **Bộ ba tù nhân Chibi hài hước:** 3 thành viên đội thua mặc áo tù sọc ngang đen trắng, đứng khóc ròng sau hàng song sắt ánh kim bạc-xanh phản chiếu.
  - Bóng thoại kêu oan nổi hẳn lên phía trước song sắt (`zIndex: 15`): *"😭 Oan quá!"*, *"🥺 Biết thế!"*, *"😫 Cứu với!"*.
- **Chú Công An Chibi:** Đội mũ kê-pi gắn sao vàng, đeo còi, tay cầm còng số 8 với huy hiệu đỏ *"👮‍♂️ ĐÃ BẮT TÙ"*.
- **Bảng phán quyết tội danh sinh viên:** Random các tội danh hài hước (ví dụ: *"Bấm chuông nhanh hơn tốc độ load của não"*, *"Kéo co mà tưởng đang tập dưỡng sinh"*...) cùng hình phạt áp giải sang Trạm 2 rót trà đá.

---

## 5. Hệ Thống Chuông Bấm & Cướp Điểm Rebound (`BuzzerControl.jsx`)
- **Tập tin:** [`src/frontend/src/components/BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx)
- Nút bấm chuông vàng khổng lồ 3D với hiệu ứng nhịp thở thu hút ngón tay cái người chơi.
- Khi một đội trả lời sai, cơ chế **Rebound (Cướp điểm 8s)** tự động kích hoạt cho đội còn lại, đồng thời tự động gạch bỏ đáp án sai vừa bị loại trừ để tăng cơ hội lội ngược dòng.

---

## 6. Trang Quản Trị Gian Hàng (`AdminPage.jsx`)
- **Tập tin:** [`src/frontend/src/pages/admin/AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)
- Quản lý kho 600 câu hỏi, tạo phòng nhanh, reset trận, xem danh sách thí sinh và xuất file CSV tổng kết giải thưởng.
