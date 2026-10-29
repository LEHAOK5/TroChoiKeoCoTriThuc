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

## 6. Trang Quản Trị Gian Hàng Ban Tổ Chức (`AdminPage.jsx`)
- **Tập tin:** [`src/frontend/src/pages/admin/AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)
- **Hệ thống 3 Tab Quản trị chuyên nghiệp (Neo-Brutalism):**
  - **Tab 1: Quản lý phòng đấu & Trận đấu trực tiếp (`ROOMS`):** Tạo phòng nhanh các chế độ 1vs1 đến 5vs5, sinh mã QR để thí sinh quét vào phòng tức thì, phát lệnh bắt đầu trận và reset phòng đón lượt mới.
  - **Tab 2: Danh sách sinh viên & Kết quả thi đấu (`STUDENTS`):** Đồng bộ dữ liệu real-time kết quả thắng/thua, trạng thái thi đấu và trao quà lưu niệm.
  - **Tab 3: Lịch sử các trận đấu (`MATCHES`):** Thống kê tỉ lệ thắng Đội A (Tia chớp) vs Đội B (Ngọn lửa), danh sách điểm số và thời gian kết thúc từng trận.

---

## 7. Hệ Thống Quản Lý Kết Quả Thi Đấu & Trao Quà Sinh Viên Thời Gian Thực
- **Mã nguồn Backend:**
  - [`src/backend/database/supabase_init.sql`](file:///d:/KEOCOTRITHUC/src/backend/database/supabase_init.sql): Bảng `match_participants` lưu chi tiết mỗi lượt chơi của sinh viên (`student_id`, `room_code`, `match_code`, `team`, `result: PLAYING | WIN | LOSE | DRAW`, `reward_claimed`, `claimed_at`).
  - [`src/backend/src/repositories/participant.repository.js`](file:///d:/KEOCOTRITHUC/src/backend/src/repositories/participant.repository.js): Tự động tạo bảng nếu chưa có, ghi nhận sinh viên vào trận, cập nhật kết quả tự động khi kết thúc trận, truy vấn kèm thống kê W/L và cập nhật trao quà.
  - [`src/backend/src/game/GameRoom.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/GameRoom.js):
    - Khi sinh viên vào phòng: Ghi nhận trạng thái `PLAYING` và phát sóng `adminParticipantJoined`.
    - Khi trận đấu kết thúc: Tự động chốt `WIN` / `LOSE` cho toàn bộ sinh viên trong phòng và phát sóng `adminMatchFinished`.
  - [`src/backend/src/routes/admin.routes.js`](file:///d:/KEOCOTRITHUC/src/backend/src/routes/admin.routes.js):
    - `GET /api/admin/students`: Lấy danh sách sinh viên kèm trạng thái thi đấu gần nhất, số trận, số lần thắng/thua, tình trạng nhận quà.
    - `GET /api/admin/students/:studentId/history`: Lấy toàn bộ lịch sử đấu của từng sinh viên.
    - `PATCH /api/admin/participants/:participantId/claim`: Xác nhận đã trao quà lưu niệm.
    - `GET /api/admin/registrations?format=csv`: Xuất file CSV đã bổ sung các cột Tổng trận, Số trận thắng, Số trận thua, Kết quả gần nhất và Tình trạng nhận quà.

- **Giao diện Frontend (`AdminPage.jsx` & `api.js`):**
  - **Bộ lọc trạng thái 5 chế độ (2D Comic Pills):** `Tất cả`, `⏳ Đang đấu (chấm vàng nhấp nháy)`, `🏆 Chiến thắng (xanh lá)`, `👮 Bị bắt tù (cam đỏ)`, `⚪ Chưa thi đấu (xám)`.
  - **Cập nhật Live 0-reload (Socket.io):** Khi có sinh viên quét mã vào phòng hoặc trận đấu phân định thắng bại, giao diện BTC tự động đổi màu trạng thái ngay lập tức mà không cần F5.
  - **Nút Trao quà lưu niệm (`[ 🎁 Trao quà ]`):** Thao tác 1-chạm xác nhận đã phát quà tại gian hàng, chuyển sang badge `✅ ĐÃ NHẬN`.
  - **Popup Lịch Sử Đấu Chi Tiết (`StudentHistoryModal`):** Bấm `[ 📜 Lịch sử ]` trên bất kỳ sinh viên nào để xem:
    - Thẻ tóm tắt: Tổng trận, Số trận thắng, Số trận thua, Tỉ lệ thắng (%).
    - Bảng chi tiết từng trận: Mã trận, Đội tham gia (⚡ Đội A / 🔥 Đội B), Tỉ số chung cuộc, Kết quả cá nhân, Thời gian kết thúc, Nút trao quà từng trận.

---

## 8. Hệ Thống 4 Thẻ Bài Chiến Thuật (Tactical Cards & Power-Ups)
- **Tập tin Backend:**
  - [`src/backend/src/config/constants.js`](file:///d:/KEOCOTRITHUC/src/backend/src/config/constants.js): Định nghĩa hằng số `TACTICAL_CARDS` (`FIREWALL`, `DDOS`, `DOUBLE_PULL`, `FIFTY_FIFTY`) và các sự kiện Socket.io thời gian thực (`useTacticalCard`, `tacticalCardActivated`, `cardEffectApplied`, `fiftyFiftyResult`).
  - [`src/backend/src/game/RopeCalculator.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/RopeCalculator.js): Hỗ trợ cộng $+2$ điểm và kéo 2 nấc dây khi dùng thẻ Kháng Cáo (Double Pull); hỗ trợ phạt lùi dây 1 nấc về phía đối phương (`applyPenalty`) khi trả lời sai.
  - [`src/backend/src/game/GameRoom.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/GameRoom.js): Quản lý In-Memory State trên RAM (`tacticalCards`, `roundActiveCard`, `frozenUntil`), kiểm tra tính hợp lệ của từng pha đấu, từ chối bấm chuông khi dính DDoS, loại trừ 2 đáp án sai cho 50/50 và khóa pha cướp điểm Rebound khi có Tường Lửa.
  - [`src/backend/src/sockets/gameHandlers.js`](file:///d:/KEOCOTRITHUC/src/backend/src/sockets/gameHandlers.js): Lắng nghe sự kiện `useTacticalCard` và kết nối trực tiếp vào `handleUseTacticalCard()`.
  - [`src/backend/tests/unit_test_tactical_cards.js`](file:///d:/KEOCOTRITHUC/src/backend/tests/unit_test_tactical_cards.js): Bộ kiểm thử tự động toàn diện kiểm chứng chính xác 100% logic của cả 4 thẻ bài.

- **Tập tin Frontend:**
  - [`src/frontend/src/components/TacticalCardBar.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TacticalCardBar.jsx): Thanh ngang 4 thẻ bài phong cách truyện tranh Neo-Brutalism (chiều cao $< 42\text{px}$ trên Mobile, viền đen dày $2.5\text{px}$, đổ bóng cứng 3D). Tự động bật/tắt khả năng bấm tùy theo từng pha câu hỏi.
  - [`src/frontend/src/components/BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx):
    - Tích hợp thanh thẻ bài `TacticalCardBar` ngay phía trên cụm chuông và 4 đáp án.
    - Hiệu ứng **Đóng băng nứt nẻ xanh tuyết (`❄️ BỊ ĐÓNG BĂNG`)** lên nút chuông 3D khi bị dính đòn DDoS, tạm khóa thao tác bấm trong 2.5s.
    - Hiệu ứng **Đóng dấu mộc đỏ chéo ngang `❌ BÁC BỎ`** và làm mờ $35\%$ lên 2 đáp án sai khi kích hoạt thẻ 50/50.
  - [`src/frontend/src/components/TugOfWarArena.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx):
    - Hiệu ứng màng lưới năng lượng lục giác xanh dương `#38BDF8` bao bọc 5 bạn Chibi khi kích hoạt `🛡️ TƯỜNG LỬA`.
    - Huy hiệu bốc lửa `⚡⚖️ X2 LỰC KÉO!` nhún nhảy trên nơ dây kéo khi kích hoạt `KHÁNG CÁO TỐI CAO`.
    - Bóng thoại dở khóc dở cười `🥶 Bị DDoS lag quá!` trên đầu đội bị đóng băng.
  - [`src/frontend/src/utils/audio.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/utils/audio.js): 4 hàm Synthesizer Web Audio API độc lập, 100% offline không cần file mp3 ngoài:
    - `playShieldUp()`: Tiếng năng lượng tạo khiên bảo vệ.
    - `playFreezeSfx()`: Tiếng băng tuyết đóng băng sắc lạnh nứt nẻ.
    - `playDoubleGavel()`: Tiếng búa công lý Thẩm phán gõ dồn vang 2 nhịp.
    - `playFiftyFiftyDismiss()`: Tiếng đóng dấu mộc bác bỏ đáp án.
  - [`src/frontend/src/App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx): Đồng bộ trạng thái thẻ bài, xử lý countdown thời gian đóng băng DDoS và tự động phát âm thanh hiệu ứng tương ứng.

- **4 Thẻ bài chiến thuật hoàn chỉnh:**
  1. **🛡️ TƯỜNG LỬA (FIREWALL):** Khóa quyền cướp điểm Rebound của đối thủ nếu trả lời sai.
  2. **❄️ TẤN CÔNG DDoS (DDOS):** Đóng băng nút bấm chuông vàng 3D của đối thủ trong 2.5 giây đầu.
  3. **⚖️ KHÁNG CÁO TỐI CAO (DOUBLE_PULL):** Đúng được $+2$ điểm (dây giật 2 nấc), Sai bị phạt lùi 1 nấc dây về đối phương.
  4. **🔍 LUẬT SƯ TƯ VẤN (FIFTY_FIFTY):** Loại trừ 2 đáp án sai ngẫu nhiên, đóng dấu mộc đỏ `❌ BÁC BỎ`.
- **Luật cân bằng trận đấu:** Mỗi thẻ chỉ dùng 1 lần/trận; mỗi round chỉ kích hoạt tối đa 1 thẻ/đội; hồi phục 4 thẻ khi bắt đầu trận mới.
- **Quy chuẩn hiển thị:** Nằm trọn vẹn trong chiều cao `100dvh`, không gây cuộn trang trên mọi thiết bị di động.

---

## 9. Màn Chiếu TV Trực Tiếp & Chế Độ Khán Giả Độc Lập (Live Arena Spectator Mode)
- **Tập tin Frontend:**
  - [`src/frontend/src/pages/admin/LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx): Trang chuyên dụng phục vụ trình chiếu TV / Máy chiếu lớn tỷ lệ 16:9 Full HD & 4K không có thanh cuộn.
  - [`src/frontend/src/pages/admin/AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx):
    - Bổ sung nút điều hướng thứ 4: **`🔴 📺 XEM TRẬN ĐẤU TRỰC TIẾP`** kế bên `🏆 LỊCH SỬ TRẬN ĐẤU`.
    - Bổ sung nút **`[ 📺 Chiếu TV ↗ ]`** trên mỗi thẻ phòng đấu tại Tab 1 (ROOMS) để mở nhanh cửa sổ/tab mới.
  - [`src/frontend/src/App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx): Tự động nhận diện URL tham số `?spectate=:roomCode` hoặc `?tv=:roomCode` hoặc hash `#live` để nạp ngay trang trực tiếp mà không cần đăng nhập.
- **Tập tin Backend:**
  - [`src/backend/src/sockets/roomHandlers.js`](file:///d:/KEOCOTRITHUC/src/backend/src/sockets/roomHandlers.js):
    - Hỗ trợ sự kiện Socket `joinSpectator` và `leaveSpectator`.
    - Gửi snapshot toàn bộ trạng thái phòng đấu tức thì (`spectatorJoinedSuccess`) cho màn hình TV ngay khi vừa kết nối mà **không chiếm slot thí sinh 5vs5 của phòng**.
- **Tính năng nổi bật cho màn hình TV gian hàng sự kiện:**
  1. **Giao diện Đấu Trường Khổng Lồ:** Đấu trường 10 Chibi VHU (áo Xanh & Cam), dây thừng kéo lực chuyển động mượt mà, Thẩm phán tri thức gõ búa công lý, tỉ số cực đại `⚡ ĐỘI A  [ 7 - 5 ]  ĐỘI B 🔥`.
  2. **Hộp Câu Hỏi & 4 Đáp Án Cỡ Đại (2x2 Grid):** Tối ưu font chữ to rõ (1.25rem - 1.5rem), tương phản cao, dễ đọc từ khoảng cách 5 - 10 mét. Hiển thị trực quan:
     - Ai bấm chuông giành quyền trả lời (vàng rực).
     - Đáp án đúng sáng xanh lá kèm tiếng reo hò; đáp án sai sáng đỏ.
     - Pha cướp điểm Rebound 8 giây.
     - Hiệu ứng thẻ bài (Tường lửa, Đóng băng DDoS, X2 Lực kéo, 50/50 bác bỏ).
  3. **Chế độ Sảnh chờ & Quét mã QR khổng lồ:** Khi phòng ở trạng thái LOBBY, màn hình TV tự động chiếu danh sách thành viên 2 đội cùng mã QR to ở chính giữa để sinh viên đến gian hàng có thể quét điện thoại tham gia lượt tiếp theo.
  4. **Công cụ Trình Chiếu Chuyên Nghiệp:**
     - Nút `⛶ Toàn màn hình (F11)`: Trình chiếu tràn viền 100%.
     - Nút `🔊 / 🔇 Âm thanh TV`: Bật/tắt âm thanh ra loa TV độc lập với máy tính Admin.
     - Nút `⚡ Tự bắt trận (Auto-follow)`: Tự động chuyển màn hình TV sang phòng đang thi đấu sôi nổi nhất.
     - Nút `↗ TAB TV RIÊNG`: Cho phép mở một tab trình duyệt riêng biệt kéo sang màn hình TV qua cáp HDMI, giúp laptop của BTC vẫn ở trang Admin để quản trị bình thường.
