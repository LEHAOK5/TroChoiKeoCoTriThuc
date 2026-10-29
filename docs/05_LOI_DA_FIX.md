# 🛠️ DANH SÁCH CÁC LỖI ĐÃ ĐƯỢC FIX (BUG FIXES LOG)

Tài liệu này lưu lại nguyên nhân, phân tích kỹ thuật và giải pháp xử lý cho các lỗi phát sinh trong quá trình vận hành, chạy thử nghiệm hệ thống **Kéo Co Tri Thức**.

---

## 1. Lỗi Không Xem Được Lịch Sử Trận Đấu Của Sinh Viên Trong Modal Quản Trị

### 🔴 Triệu chứng lỗi (Symptoms)
- Khi Ban tổ chức vào trang Admin (`AdminPage.jsx`), tại **Tab 2: Danh sách sinh viên**, bấm nút **`[ 📜 Lịch sử ]`** của bất kỳ sinh viên nào (ví dụ: `Lê Nhựt Hào - 231A010369`), trình duyệt bật popup alert thông báo:
  > *"Không thể tải lịch sử trận đấu của sinh viên: Không thể tải lịch sử đấu của sinh viên"*
- Khung Modal lịch sử hiển thị quay tròn hoặc trống không, không tải được các trận đấu sinh viên đã tham gia.

---

### 🔍 Phân tích nguyên nhân cốt lõi (Root Cause Analysis)

1. **Độ trễ cập nhật Backend trên Render (Primary Cause):**
   - Frontend trên Vercel (`keo-co-tri-thuc.vercel.app`) tự động build và deploy ngay khi có commit mới.
   - Tuy nhiên, Backend trên Render (`keoco-backend.onrender.com`) ở gói Free có thể chưa kịp kích hoạt Auto-Deploy tự động với commit mới, khiến service backend trên Render vẫn đang chạy phiên bản cũ chưa có endpoint `GET /api/admin/students/:studentId/history`.
   - Kết quả: Server Render trả về mã lỗi `404 Route không tồn tại`.

2. **Truy vấn SQL trong Backend thiếu trường khóa chính `id`:**
   - Trong [`participant.repository.js`](file:///d:/KEOCOTRITHUC/src/backend/src/repositories/participant.repository.js), hàm `getStudentMatchHistory()` trước đó chỉ chọn `p.id AS participant_id` mà không alias `p.id AS id`.
   - Điều này dẫn đến khi render danh sách trong Modal, trường `h.id` bị `undefined`, gây lỗi khi bấm nút `[ 🎁 Trao quà ]` từ trong modal.

3. **Thiếu cơ chế Fallback và xử lý ngoại lệ ở Frontend:**
   - Hàm `getStudentHistory()` trong [`api.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/services/api.js) ném ngoại lệ trực tiếp (`throw new Error(...)`) khi HTTP response không `ok`.
   - Hàm `handleOpenStudentHistory()` trong `AdminPage.jsx` bắt lỗi này và gọi hàm `alert()` chặn luồng giao diện người dùng, khiến trải nghiệm bị gián đoạn.
   - Chưa có tầng tra cứu fallback vào bảng `match_history` khi bảng chi tiết `match_participants` của trận đó chưa kịp đồng bộ.

---

### 🟢 Giải pháp kỹ thuật đã xử lý (Fix Implementation)

#### 1. Nâng cấp Backend [`participant.repository.js`](file:///d:/KEOCOTRITHUC/src/backend/src/repositories/participant.repository.js)
- Chuẩn hóa trường trả về: Bổ sung đầy đủ `p.id`, `p.id AS participant_id`.
- Chuẩn hóa thời gian: `COALESCE(p.finished_at, m.finished_at, p.joined_at) AS finished_at`.
- **Cơ chế Fallback thông minh:** Nếu trong bảng `match_participants` chưa có dữ liệu của sinh viên, hệ thống sẽ tự động truy vấn ngược vào bảng `match_history` (quét cột `team_a_players` và `team_b_players` dạng JSON) để trích xuất trận đấu sinh viên đã thi đấu:
  ```sql
  SELECT m.id, m.match_code, ...
  FROM match_history m
  WHERE m.team_a_players::text ILIKE '%' || $1 || '%' OR m.team_b_players::text ILIKE '%' || $1 || '%'
  ORDER BY m.id DESC;
  ```

#### 2. Nâng cấp Frontend Service [`api.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/services/api.js)
- Thêm cơ chế Fallback 2 tầng: Nếu gọi endpoint `/api/admin/students/:studentId/history` bị lỗi 404 (do backend đang deploy hoặc khởi động trễ), hàm sẽ tự động chuyển sang đọc danh sách từ `/api/admin/matches` và lọc các trận có MSSV tương ứng.
- Nếu không tìm thấy trận nào, hàm trả về danh sách rỗng `{ success: true, studentId, history: [] }` thay vì throw Exception văng alert.

#### 3. Tinh chỉnh Giao diện [`AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)
- Loại bỏ hoàn toàn `alert(...)` chặn giao diện khi tải lịch sử.
- Đảm bảo modal mở lên mượt mà; nếu chưa có lịch sử thi đấu thì hiển thị thông báo thân thiện: *"Sinh viên này chưa tham gia trận kéo co nào."*

---

## 2. Lỗi Thống Kê Trận & Trạng Thái Sinh Viên Hiển Thị "Chưa Thi Đấu (0 Trận)" Dù Đã Hoàn Thành Trận

### 🔴 Triệu chứng lỗi (Symptoms)
- Ban tổ chức đã tổ chức trận đấu xong, màn hình Tab 3 (Lịch sử trận đấu) đã ghi nhận trận đấu hoàn thành (ví dụ: `Tỉ số 10 - 3`, Đội A vô địch).
- Tuy nhiên tại **Tab 2: Danh sách sinh viên**, tất cả sinh viên tham gia vẫn hiển thị:
  - Trạng thái hiện tại: `⚪ Chưa thi đấu` (bộ lọc ghi nhận: `Chưa thi đấu (4)`)
  - Thống kê trận: `0 trận`
  - Trao quà: `---`

---

### 🔍 Phân tích nguyên nhân cốt lõi (Root Cause Analysis)

1. **Lệch pha giữa bảng `match_history` và `match_participants`:**
   - Khi trận đấu kết thúc, hệ thống lưu kết quả ván đấu vào bảng `match_history` (chứa `score_a`, `score_b`, `winner`, mảng JSON `team_a_players`, `team_b_players`).
   - Trong khi đó, bảng danh sách sinh viên thời gian thực lại được tính toán từ bảng `match_participants`.
   - Nếu trận đấu diễn ra khi Backend đang trong quá trình chuyển giao phiên bản (hoặc trước khi bảng `match_participants` được cập nhật code), dữ liệu kết quả chỉ nằm ở `match_history`, khiến `match_participants` không có dòng dữ liệu nào (`0 rows`).
2. **Hàm `getStudentsWithMatchStatus` chỉ LEFT JOIN đơn thuần:**
   - Truy vấn SQL trong `getStudentsWithMatchStatus()` chỉ đọc từ `match_participants`. Khi bảng này chưa có dữ liệu, câu lệnh trả về mặc định `total_matches = 0`, `wins = 0`, `last_result = 'NOT_PLAYED'`.

---

### 🟢 Giải pháp kỹ thuật đã xử lý (Fix Implementation)

#### 1. Xây dựng cơ chế Auto-Sync thông minh (`syncLegacyMatchesToParticipants`)
- Thêm hàm `syncLegacyMatchesToParticipants()` trong [`participant.repository.js`](file:///d:/KEOCOTRITHUC/src/backend/src/repositories/participant.repository.js):
  - Tự động quét toàn bộ các trận đấu đã ghi nhận trong `match_history`.
  - Phân tách thí sinh Đội A và Đội B từ mảng JSON, đối chiếu với kết quả trận (`winner: 'A' | 'B' | 'DRAW'`) để xác định chính xác sinh viên nào `WIN` hay `LOSE`.
  - Thực hiện lệnh chèn an toàn chống trùng lặp (`WHERE NOT EXISTS`):
    ```sql
    INSERT INTO match_participants (match_code, room_code, student_id, student_name, team, result, finished_at)
    SELECT $1, $1, $2, $3, 'A', $4, COALESCE($5, NOW())
    WHERE NOT EXISTS (
      SELECT 1 FROM match_participants WHERE match_code = $1 AND student_id = $2
    );
    ```

#### 2. Tự động đồng bộ mỗi lần BTC xem hoặc làm mới danh sách
- Trong hàm `getStudentsWithMatchStatus()`, hệ thống tự động gọi `await syncLegacyMatchesToParticipants()` trước khi chạy truy vấn thống kê.
- Ngay khi Ban tổ chức bấm **"Làm mới 🔄"** hoặc mở Tab 2:
  - Sinh viên chiến thắng lập tức được cập nhật: `🏆 CHIẾN THẮNG`, thống kê `1 trận (1W - 0L)`, nút `[ 🎁 Trao quà ]` xuất hiện.
  - Sinh viên thua cuộc lập tức được cập nhật: `👮 BỊ BẮT TÙ`, thống kê `1 trận (0W - 1L)`.

---

## 3. Lỗi "Failed to fetch" Khi Bấm Nút `[ 🎁 Trao quà ]` (CORS Preflight & HTTP Method)

### 🔴 Triệu chứng lỗi (Symptoms)
- Khi Ban tổ chức ở trang Admin trên Vercel (`keo-co-tri-thuc.vercel.app`), tại **Tab 2: Danh sách sinh viên**, bấm nút **`[ 🎁 Trao quà ]`** để đánh dấu đã trao quà lưu niệm cho sinh viên hoàn thành trận đấu:
  - Trình duyệt bật hộp thoại popup alert: **`keo-co-tri-thuc.vercel.app says: Failed to fetch`**
  - Nút bấm bị kẹt ở nhãn trạng thái **`Đang lưu...`** và quà chưa được xác nhận `✅ ĐÃ NHẬN`.

---

### 🔍 Phân tích nguyên nhân cốt lõi (Root Cause Analysis)

1. **Thiếu HTTP Method `PATCH` trong cấu hình CORS Backend (`src/backend/src/config/cors.js`):**
   - Cấu hình CORS ban đầu:
     ```javascript
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
     ```
   - Phương thức **`PATCH` hoàn toàn không có trong danh sách được phép**.
2. **Cơ chế CORS Preflight (`OPTIONS`) của trình duyệt giữa Vercel và Render:**
   - Frontend chạy tại domain `keo-co-tri-thuc.vercel.app`, gọi API Cross-Origin sang backend `keoco-backend.onrender.com`.
   - Hàm `claimParticipantReward()` trong [`api.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/services/api.js) thực hiện gửi HTTP Request với method `PATCH`.
   - Khi gặp HTTP method `PATCH`, trình duyệt bắt buộc kích hoạt gửi một request kiểm tra quyền trước (CORS Preflight `OPTIONS`) kèm header:
     `Access-Control-Request-Method: PATCH`
   - Do cấu hình CORS trên backend Render thiếu `PATCH`, server Express-CORS từ chối preflight request. Trình duyệt ngay lập tức chặn đứng request và ném ra ngoại lệ JavaScript: `TypeError: Failed to fetch`.
3. **Route Backend chỉ mở phương thức `PATCH`:**
   - Trong [`admin.routes.js`](file:///d:/KEOCOTRITHUC/src/backend/src/routes/admin.routes.js), route xác nhận trao quà chỉ khai báo `router.patch(...)`, không có `router.post(...)`.

---

### 🟢 Giải pháp kỹ thuật đã xử lý (Fix Implementation)

#### 1. Bổ sung `PATCH` vào CORS Whitelist ([`src/backend/src/config/cors.js`](file:///d:/KEOCOTRITHUC/src/backend/src/config/cors.js))
- Đã thêm `'PATCH'` vào mảng `methods`:
  ```javascript
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  ```

#### 2. Mở song song cả 2 Route `POST` và `PATCH` ([`src/backend/src/routes/admin.routes.js`](file:///d:/KEOCOTRITHUC/src/backend/src/routes/admin.routes.js))
- Khai báo đồng thời để đáp ứng mọi client và proxy:
  ```javascript
  router.patch('/participants/:participantId/claim', handleClaimReward);
  router.post('/participants/:participantId/claim', handleClaimReward);
  ```

#### 3. Tối ưu Frontend Service với cơ chế chịu lỗi kép ([`src/frontend/src/services/api.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/services/api.js))
- `claimParticipantReward()` ưu tiên gửi `POST` (phương thức chuẩn nhất của HTTP tránh bị chặn preflight), đồng thời tự động fallback sang `PATCH` nếu kết nối backend cũ.
- Bọc bắt lỗi chu đáo, hiển thị thông báo rõ ràng bằng tiếng Việt nếu backend Render đang khởi động lại thay vì văng chữ `Failed to fetch`.

#### 4. Đồng bộ tức thời giao diện Admin ([`src/frontend/src/pages/admin/AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx))
- Hàm `handleClaimReward(participantId, studentName, studentId)` cập nhật trạng thái `reward_claimed: true` đồng loạt cho tất cả các dòng có cùng `student_id` và `last_participant_id`.
- Thao tác chuyển ngay lập tức sang `✅ ĐÃ NHẬN` mà không cần Ban tổ chức phải tải lại toàn bộ trang.

---

### 📌 Lưu ý vận hành (Deployment Note)
Sau khi push commit lên GitHub:
1. **Frontend Vercel:** Tự động build và cập nhật sau khoảng 1 - 2 phút.
2. **Backend Render:** Nếu dịch vụ Render đang tắt tính năng Auto-Deploy:
   - Truy cập [dashboard.render.com](https://dashboard.render.com).
   - Chọn service **`keoco-backend`**.
   - Bấm **Manual Deploy** -> Chọn **Deploy latest commit** để nạp cấu hình CORS mới.

---

## 4. Lỗi Không Hiển Thị 4 Thẻ Bài Chiến Thuật & Nút Chuông Bị Đẩy Tràn Trên Điện Thoại Di Động

- **Thời gian xử lý:** 27/10/2026.
- **Tập tin liên quan:**
  - [`src/frontend/vercel.json`](file:///d:/KEOCOTRITHUC/src/frontend/vercel.json)
  - [`src/frontend/index.html`](file:///d:/KEOCOTRITHUC/src/frontend/index.html)
  - [`src/frontend/src/components/TacticalCardBar.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TacticalCardBar.jsx)
  - [`src/frontend/src/styles/index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)

### 1. Hiện Tượng & Báo Cáo Từ Thí Sinh
- Trên máy tính / laptop: Giao diện hiển thị đầy đủ 4 thẻ bài chiến thuật và nút bấm chuông vàng 3D.
- Trên điện thoại di động:
  - Mở trang web không thấy xuất hiện thanh 4 thẻ bài chiến thuật.
  - 4 nút đáp án bị dàn thành 1 cột dọc dài, đẩy nút bấm chuông vàng 3D trôi tụt hẳn xuống đáy màn hình, người chơi phải cuộn màn hình mới thấy được nút chuông.

---

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Causes)

#### Nguyên nhân 1: Trình duyệt di động (Chrome/Safari) lưu Cache cứng SPA Bundle cũ
- Khi người chơi mở tab trên điện thoại và tham gia trận đấu liên tục, trình duyệt di động giữ nguyên kết nối WebSocket và không tự động tải lại file JavaScript bundle mới của Vercel trừ khi người chơi đóng hẳn tab hoặc xóa cache.
- File [`vercel.json`](file:///d:/KEOCOTRITHUC/src/frontend/vercel.json) và [`index.html`](file:///d:/KEOCOTRITHUC/src/frontend/index.html) trước đó chưa cấu hình các chỉ thị `Cache-Control: public, max-age=0, must-revalidate` và thẻ `meta http-equiv="Cache-Control"`, khiến trình duyệt điện thoại ưu tiên đọc từ bộ nhớ đệm cục bộ (Memory/Disk Cache).

#### Nguyên nhân 2: Tràn chiều cao màn hình di động (Mobile Layout Height Crunch)
- Trên điện thoại di động (chiều cao khả dụng thực tế chỉ khoảng **600px - 650px** do bị trừ thanh URL trên cùng và thanh điều hướng 3 nút ảo `■ ● ◀` bên dưới):
  - `app-header`: 48px
  - `arena-card` (sàn đấu kéo co Chibi): 220px (chiều cao `rope-stage` mặc định 138px)
  - `question-tier` (hộp câu hỏi): 120px
  - 4 đáp án xếp dạng 1 cột dọc (`grid-template-columns: 1fr`): chiếm tới **210px**!
  - Nút bấm chuông vàng 3D khổng lồ: 110px
  - Tổng chiều cao lên tới **750px - 780px**, vượt xa chiều cao màn hình điện thoại.
- Kết quả: Khi không cuộn màn hình, thanh thẻ bài và nút chuông vàng bị đẩy lệch hoặc trôi khỏi tầm mắt ngón tay cái của người chơi.

---

### 3. Giải Pháp Khắc Phục Triệt Để

1. **Cấu hình chống Cache ngầm trên Vercel & HTML:**
   - [`src/frontend/vercel.json`](file:///d:/KEOCOTRITHUC/src/frontend/vercel.json): Thiết lập header `Cache-Control: public, max-age=0, must-revalidate` cho trang `index.html` để điện thoại luôn đối chiếu phiên bản mới nhất từ server mỗi khi mở trang.
   - [`src/frontend/index.html`](file:///d:/KEOCOTRITHUC/src/frontend/index.html): Bổ sung 3 thẻ meta:
     ```html
     <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
     <meta http-equiv="Pragma" content="no-cache" />
     <meta http-equiv="Expires" content="0" />
     ```

2. **Tối ưu thanh thẻ bài trên Mobile ([`TacticalCardBar.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TacticalCardBar.jsx)):**
   - Đặt `id="tactical-card-bar"`, `flexShrink: 0`, `position: 'relative'`, `zIndex: 10` đảm bảo không bao giờ bị đè lấp.
   - Bổ sung icon trực quan trên nút bấm di động: `❄️ DDoS`, `⚖️ X2 Kéo`, `🔍 50/50`, `🛡️ T.Lửa`.

---

## 5. Lỗi Hiển Thị Kích Thước Ô Đáp Án Bị Lệch Bất Thường & Bẻ Gãy Từ Ngữ Trên Điện Thoại Di Động

- **Thời gian xử lý:** 27/10/2026.
- **Tập tin liên quan:**
  - [`src/frontend/src/components/BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx)
  - [`src/frontend/src/styles/index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)

### 1. Hiện Tượng & Báo Cáo
- Khi câu hỏi có đáp án chứa cụm từ dài hoặc thuật ngữ chuyên ngành (ví dụ: `.ipa (iOS App Store Package)`):
  - Ô đáp án B bị co hẹp theo chiều ngang, chữ bị bẻ gãy vụn thành 6 dòng cụt lủn và ngắt đôi chữ cái giữa chừng: `Packa` xuống dòng `ge)`.
  - Ô đáp án A bên cạnh chỉ chứa chữ ngắn `.apk` nhưng lại bị kéo dãn cao chót vót (~120px) thành một khối hộp trống hoác để bằng chiều cao ô B.
  - Hàng 2 (ô C và D) lại ngắn bình thường (~40px), gây ra hiện tượng mất cân đối thị giác nghiêm trọng (ô trên khổng lồ, ô dưới lép kẹp).

---

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Causes)

1. **Bề ngang bị chia đôi trong lưới 2x2 trên màn hình hẹp:**
   - Khi áp dụng `grid-template-columns: 1fr 1fr` trên điện thoại di động (chiều rộng màn hình chỉ từ **360px - 390px**), bề ngang mỗi ô bị giảm xuống còn khoảng **160px**.
   - Sau khi trừ đi huy hiệu chữ `A/B/C/D` (24px), biểu tượng hình học `⚪/🔺/⏹️/🔶` (20px), icon ổ khóa `🔒` (20px) và padding biên, **chiều rộng thực tế dành cho văn bản đáp án chỉ còn ~80px**.
   - Không gian 80px là quá hẹp đối với các đáp án câu hỏi kiến thức IT và Pháp luật, khiến chữ bị dồn ứ ngắt dòng liên tục.

2. **Thuộc tính CSS bẻ gãy từ ngữ tùy tiện (`overflowWrap: anywhere`):**
   - Trong `BuzzerControl.jsx`, thuộc tính `overflowWrap: 'anywhere'` và `wordBreak: 'break-word'` buộc trình duyệt phải ngắt dòng tại bất kỳ ký tự nào khi vượt quá 80px, dẫn đến các từ như `Package)` bị xé đôi thành `Packa` và `ge)`.

3. **Cơ chế kéo dãn đồng đều hàng của CSS Grid:**
   - Trong CSS Grid 2 cột, 2 ô nằm trên cùng một hàng (hàng 1 gồm ô A và ô B) luôn tự động kéo dãn chiều cao bằng nhau (`align-items: stretch`). Khi ô B dài và phình to lên 120px, ô A bắt buộc phải phình theo, tạo ra các ô đáp án to nhỏ không đồng đều.

---

### 3. Giải Pháp Khắc Phục Triệt Để

1. **Chuẩn hóa lưới đáp án Mobile sang 1 cột dọc toàn chiều ngang ([`index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)):**
   - Đặt lại `.answer-grid` trên mobile về `grid-template-columns: 1fr; gap: 5px; width: 100%;`.
   - Mỗi ô đáp án sở hữu trọn vẹn toàn bộ bề ngang màn hình (~350px), mang lại vùng đệm văn bản rộng rãi **~260px** (gấp 3.2 lần so với 80px trước đó).
   - Đáp án dài `.ipa (iOS App Store Package)` hiển thị gọn gàng trên đúng 1 dòng duy nhất mà không bị xuống dòng.

2. **Loại bỏ thuộc tính cắt vụn từ ngữ ([`BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx)):**
   - Chuyển `wordBreak: 'normal'` và `overflowWrap: 'break-word'`.
   - Đảm bảo các từ ngữ, thuật ngữ tiếng Việt và tiếng Anh luôn giữ nguyên khối, chỉ xuống dòng khi hết từ tự nhiên.

3. **Tối ưu kích thước ô đồng nhất ([`index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)):**
   - Thiết lập `min-height: 38px`, `padding: 5px 10px`, `font-size: 0.84rem`, `border-radius: 12px`.
   - Nút chuông vàng 3D điều chỉnh kích thước `88px x 88px` để cân đối hoàn hảo trong viewport `100dvh`.
   - Cả 4 ô đáp án A, B, C, D đều có kích thước hài hòa, đều đặn, không còn tình trạng ô khổng lồ ô tí hon.

---

## 6. Lỗi Ô Nhập Mã Phòng Bị Mất Chữ (VD: 8291) Trên Giao Diện Điện Thoại

- **Thời gian xử lý:** 28/10/2026.
- **Tập tin liên quan:**
  - [`src/frontend/src/pages/RegisterPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/RegisterPage.jsx)

### 1. Hiện Tượng & Báo Cáo
- Trên màn hình điện thoại di động tại trang Đăng ký vào phòng (`RegisterPage`):
  - Ô nhập mã phòng thi đấu bị cắt cụt chữ: Placeholder hiển thị `MÃ PHÒNG (VD: 8291` và bị mất dấu đóng ngoặc `)` cùng khoảng biên phải, chữ bị che khuất sát mép nút bấm `[ Kiểm tra ]`.

---

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Causes)

1. **Chuỗi placeholder quá dài đối với độ rộng màn hình hẹp:**
   - Chuỗi `MÃ PHÒNG (VD: 8291)` dài tới **22 ký tự in hoa**.
   - Trong khi đó, nhãn tiêu đề ngay phía trên đã ghi rõ: `🔑 MÃ PHÒNG THI ĐẤU * (Hỏi BTC tại quầy)`. Việc lặp lại cụm từ `MÃ PHÒNG` bên trong ô placeholder là dư thừa và chiếm dụng diện tích không cần thiết.

2. **Cộng hưởng khoảng cách ký tự (`letterSpacing: 1.5`):**
   - Thuộc tính `letterSpacing: 1.5` được thiết lập cố định cho cả ô input, khiến ngay cả khi chưa nhập gì thì mỗi ký tự trong placeholder cũng bị cộng thêm 1.5px (22 * 1.5px = **33px cộng thêm**), làm chuỗi chữ bị kéo dãn vượt khỏi khung nhìn.

3. **Cạnh tranh không gian cùng hàng với nút [Kiểm tra]:**
   - Ô input và nút `[ Kiểm tra ]` (có `minWidth: 80px`) được xếp cùng 1 hàng flex (`flex: 1` và `flexShrink: 0`).
   - Trên màn hình điện thoại di động có chiều rộng từ **360px - 390px**, sau khi trừ padding của thẻ card và khung vàng, không gian còn lại cho ô input chỉ khoảng **~210px**, không thể chứa vừa 22 ký tự chữ đậm in hoa cỡ 1.05rem kèm letter-spacing 1.5px.

---

### 3. Giải Pháp Khắc Phục Triệt Để

1. **Tối ưu Placeholder tương thích theo thiết bị (`isMobile`):**
   - Trên mobile: Chuyển placeholder thành `VD: 8291` (ngắn gọn chỉ 8 ký tự, chiếm chưa đến 80px bề ngang).
   - Trên laptop/máy tính: Giữ nguyên `MÃ PHÒNG (VD: 8291)`.
   ```jsx
   placeholder={isMobile ? "VD: 8291" : "MÃ PHÒNG (VD: 8291)"}
   ```

2. **Áp dụng `letterSpacing` thông minh chỉ khi người dùng nhập dữ liệu:**
   - Khi ô đang trống (hiển thị placeholder): `letterSpacing: 'normal'` để placeholder hiển thị gọn gàng, tự nhiên.
   - Khi người dùng gõ mã phòng (ví dụ `8291`): `letterSpacing: isMobile ? 1.5 : 2` để các ký tự mã phòng to rõ, cách điệu đẹp mắt.
   ```jsx
   letterSpacing: formData.roomCode ? (isMobile ? 1.5 : 2) : 'normal'
   ```

3. **Điều chỉnh kích thước & khoảng đệm cân đối:**
   - Cỡ chữ mobile: `fontSize: isMobile ? '0.96rem' : '1.15rem'`.
   - Padding mobile: `padding: isMobile ? '8px 10px' : '12px 14px'`.
   - Nút `[ Kiểm tra ]`: `minWidth: isMobile ? 74 : 96`, `padding: isMobile ? '0 8px' : '0 16px'`.
   - **Kết quả:** Placeholder `VD: 8291` hiển thị trọn vẹn 100%, cách lề thoáng đãng, không bao giờ bị cắt chữ hay mất dấu ngoặc trên bất kỳ dòng điện thoại nào.

---

## 7. Lỗi Chữ Đen Trên Nền Xanh Admin & Nền Ngoài Màn Hình Kết Quả Trận Đấu Chưa Thuần #1A1AFF 100%

- **Thời gian xử lý:** 28/10/2026.
- **Tập tin liên quan:**
  - [`src/frontend/src/pages/admin/AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)
  - [`src/frontend/src/styles/index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)
  - [`src/frontend/src/components/VictoryCutscene.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryCutscene.jsx)

### 1. Hiện Tượng & Báo Cáo
1. **Trên Bảng điều khiển Ban tổ chức (`AdminPage.jsx`):**
   - Tiêu đề mục `🔴 CÁC PHÒNG ĐẤU ĐANG HOẠT ĐỘNG (0)` và dòng trạng thái `Đồng bộ trực tiếp với màn hình sinh viên` bị màu đen/xám than trên nền xanh `#1A1AFF`, rất khó đọc và thiếu tương phản.
2. **Trên Màn hình Kết thúc trận đấu & Hiển thị kết quả (`VictoryModal.jsx`):**
   - Nền ngoài bao quanh thẻ hiển thị kết quả có quầng màu tối dần về viền (vignette navy/đen) và lộ màu cam/xanh của sân đấu bên dưới do hiệu ứng làm mờ `backdrop-filter`, chưa phải màu xanh thuần `#1A1AFF` 100% phẳng, sạch sẽ.

---

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Causes)
1. **Thiếu màu tương phản trên nền xanh bên ngoài thẻ Card (`AdminPage.jsx`):**
   - Thẻ `h2` tiêu đề `🔴 CÁC PHÒNG ĐẤU ĐANG HOẠT ĐỘNG` được đặt trực tiếp ngoài nền xanh nhưng lại dùng `color: '#0F172A'` (màu xám than gần đen) và subtext dùng `color: '#64748B'`, khiến chữ bị chìm tối hoàn toàn vào nền xanh `#1A1AFF`.
2. **Lớp phủ `.overlay-backdrop` và `.faceoff-backdrop` dùng dải chuyển màu radial & hiệu ứng kính mờ (`index.css`):**
   - `.overlay-backdrop` trước đây sử dụng `background: radial-gradient(circle at center, rgba(26, 26, 255, 0.28) 0%, rgba(10, 10, 70, 0.78) 100%)` cùng `backdrop-filter: blur(10px)`.
   - Điều này tạo ra một lớp phủ tối dần thành màu đen ở 4 góc và làm nhòe các dải màu của giao diện phía sau (vạch dây kéo, banner cam đội B) xuyên lên phía trên, làm mất đi tính thuần nhất phẳng của màu xanh nhận diện `#1A1AFF`.

---

### 3. Giải Pháp Khắc Phục Triệt Để
1. **Đồng bộ màu sắc tương phản cao cho chữ ngoài nền xanh ([`AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)):**
   - Đổi tiêu đề `🔴 CÁC PHÒNG ĐẤU ĐANG HOẠT ĐỘNG` thành màu trắng tinh khiết `#FFFFFF` kèm đổ bóng comic `textShadow: '0 2px 0 var(--comic-black)'`.
   - Đổi dòng trạng thái thành màu vàng rực rỡ `#FEF08A` kèm đổ bóng `textShadow: '0 1px 2px rgba(0,0,0,0.6)'`.
   - Đổi nhãn `Danh sách {matches.length} trận đấu gần đây nhất` thành `#FFFFFF` và nhãn `Bộ lọc: "..."` thành `#FEF08A`.
2. **Chuyển toàn bộ nền ngoài màn hình kết quả và đếm ngược sang `#1A1AFF` 100% phẳng ([`index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css), [`VictoryCutscene.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryCutscene.jsx)):**
   - `.overlay-backdrop`: Thiết lập `background-color: #1A1AFF; background: #1A1AFF;`, loại bỏ hoàn toàn `radial-gradient` và `backdrop-filter`.
   - `.faceoff-backdrop`: Thiết lập `background-color: #1A1AFF; background: #1A1AFF;`.
   - `VictoryCutscene`: Chuyển background thành `#1A1AFF` phẳng.
   - **Kết quả:** Thẻ kết quả chiến thắng màu trắng viền đen dày nổi bật rực rỡ trên nền ngoài màu xanh thuần `#1A1AFF` phẳng 100%, sạch sẽ, không có bất kỳ đốm hạt hay quầng đen bóng ma nào.

---

## 8. Lỗi Nút Chuông Vàng Bị Văng/Cắt Mất Dưới Đáy Màn Hình Mobile & Tối Ưu Bố Cục Vừa Vặn 100dvh

- **Thời gian xử lý:** 28/10/2026.
- **Tập tin liên quan:**
  - [`src/frontend/src/styles/index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css)
  - [`src/frontend/src/components/QuestionBox.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/QuestionBox.jsx)
  - [`src/frontend/src/components/TacticalCardBar.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TacticalCardBar.jsx)
  - [`src/frontend/src/components/BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx)
  - [`src/frontend/src/pages/LobbyPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/LobbyPage.jsx)

### 1. Hiện Tượng & Báo Cáo
- Khi trải nghiệm ván đấu trên điện thoại di động (viewport 390x844px):
  - Nút tròn chuông vàng 3D ("BẤM CHUÔNG!") ở dưới cùng bị **đẩy văng xuống dưới nếp gấp màn hình**, người chơi chỉ thấy được 1/3 chóp chuông hoặc khi câu hỏi dài/xuất hiện banner Match Point thì nút chuông **biến mất 100% khỏi màn hình**.
  - Người chơi buộc phải vuốt cuộn màn hình mới thấy chuông, làm mất đi tính phản xạ tức thời của trò chơi kéo co.
  - Thanh 4 thẻ bài chiến thuật có icon `🃏` thừa bị bóp méo bên trái và thẻ số 4 bị cắt chữ thành `T.Lửa`.
  - Sảnh chờ `LobbyPage` bị kéo dài tới 4 tầng thẻ, đẩy nút "SẴN SÀNG" và "THÊM BOT" xuống tận trang 2.

---

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Causes)
1. **Quá tải không gian dọc (Vertical Space Exhaustion) trên Mobile:**
   - Khung sân đấu `TugOfWarArena` chiếm tới `114px` + padding + score row = ~183px.
   - Thẻ câu hỏi `QuestionBox` chiếm ~105px.
   - Thanh thẻ bài và dòng trạng thái chiếm ~75px.
   - 4 ô đáp án xếp dọc chiếm ~210px.
   - Khối chuông vàng (kích thước 88x88px + margin + hint) chiếm ~125px.
   - Tổng chiều cao vượt quá **750px**, trong khi không gian hiển thị khả dụng trên webview điện thoại chỉ còn khoảng ~720px. Thuộc tính `min-height: calc(100dvh - 48px)` khiến layout tự phình to và sinh thanh cuộn dọc.
2. **Thanh thẻ bài chưa tối ưu lưới chia cột:**
   - Dùng icon `🃏` cố định bên trái chiếm diện tích ngang của 4 thẻ bài, khiến thẻ "TƯỜNG LỬA" thiếu chỗ hiển thị phải viết tắt thành `T.Lửa`.
3. **Sảnh chờ bị phân mảnh 2 lần:**
   - Thẻ chọn đội (Đội A, Đội B) tách rời hoàn toàn với Thẻ danh sách thành viên (Roster View), dẫn đến lặp lại 4 thẻ lớn xếp chồng nhau.

---

### 3. Giải Pháp Khắc Phục Triệt Để
1. **Thu gọn chiều cao các khối trong sân đấu để 100% vừa vặn `100dvh` không cần cuộn ([`index.css`](file:///d:/KEOCOTRITHUC/src/frontend/src/styles/index.css), [`QuestionBox.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/QuestionBox.jsx), [`BuzzerControl.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/BuzzerControl.jsx)):**
   - Khóa `.game-layout` ở chiều cao `height: calc(100dvh - 48px); max-height: calc(100dvh - 48px); box-sizing: border-box; justify-content: space-between;`.
   - Giảm chiều cao sân kéo co `.rope-stage` từ `114px` xuống `92px`, giữ nguyên toàn bộ 10 nhân vật Chibi và dây kéo cân đối theo yêu cầu người dùng.
   - Tối ưu padding `.quiz-card` từ `8px 12px` xuống `6px 10px`, cỡ chữ câu hỏi `0.88rem`.
   - Điều chỉnh ô đáp án `.answer-btn` `min-height: 33px`, `padding: 3px 8px`, `font-size: 0.81rem`.
   - Thu gọn nút chuông vàng `.buzzer-tactile` từ `88px` xuống `78px x 78px`, `marginTop: 3px`, dòng gợi ý `marginTop: 2px`.
   - **Tổng dung lượng chiều cao tiết kiệm được: ~100px**, giúp nút chuông vàng luôn hiển thị **100% trọn vẹn, to rõ và nổi bật ngay dưới ngón cái của người chơi mà không cần cuộn bất kỳ 1 pixel nào**.
2. **Tối ưu thanh thẻ bài chiến thuật ([`TacticalCardBar.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TacticalCardBar.jsx)):**
   - Ẩn icon `🃏` thừa trên mobile, chia đều 4 nút thành lưới `grid-template-columns: repeat(4, 1fr)`.
   - Tên thẻ "🛡️ TƯỜNG LỬA" hiển thị trọn vẹn, không còn bị cắt cụt `T.Lửa`.
3. **Gọn hóa Sảnh chờ ([`LobbyPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/LobbyPage.jsx)):**
   - Tích hợp trực tiếp danh sách thành viên vào bên trong thẻ Đội A và Đội B.
   - Loại bỏ khối Roster View trùng lặp, đưa nút "THÊM BOT ĐỐI THỦ" và "BẤM SẴN SÀNG THI ĐẤU" lên ngay tầm mắt người chơi.

---

## 9. Bổ Sung Nút "Thoát Game", Chiến Lược Thoát 3 Tầng & Màn Hình Phiếu Xác Nhận Kết Quả

### 1. Hiện Tượng & Vấn Đề
- Trước đây, trên màn hình kết thúc ván đấu (`VictoryModal`), hệ thống chỉ có duy nhất 1 nút "CHƠI LẠI TRẬN MỚI 🔄".
- Khi sinh viên thi đấu xong tại gian hàng ngày 30/10, các bạn không biết làm cách nào để thoát ra nhường máy cho bạn kế tiếp hoặc lấy minh chứng nhận quà.
- Sinh viên phải tìm nút "Thoát" nhỏ xíu trên thanh Header góc trên, dẫn đến việc nhiều bạn bấm nhầm nút chơi lại làm chiếm phòng và nghẽn tài nguyên trên máy chủ.

### 2. Giải Pháp Triển Khai
1. **Bố cục 2 nút hành động song song trên [`VictoryModal.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryModal.jsx):**
   - `🔄 ĐẤU VÁN MỚI`: Kích hoạt `onRematch`, reset tỉ số và đưa cả phòng về Sảnh chờ.
   - `🛑 THOÁT GAME`: Kích hoạt quy trình thoát game an toàn 3 tầng.
2. **Chiến lược thoát 3 tầng (Multi-tier Exit Strategy) trên [`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx):**
   - **Tầng 1 (Dọn dẹp & Giải phóng slot):** Gửi sự kiện socket `leaveRoom` lên máy chủ Render để nhả slot phòng ngay lập tức; xóa sạch `sessionStorage` và `localStorage` (MSSV, tên thí sinh, token).
   - **Tầng 2 (Thử đóng tab):** Gọi `window.close()` đối với các trình duyệt cho phép tự đóng tab.
   - **Tầng 3 (Màn hình Phiếu xác nhận kết quả [`ExitPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/ExitPage.jsx)):** Nếu trình duyệt chặn không cho đóng tab tự động, chuyển giao diện sang màn hình tổng kết trang trọng với nền xanh `#1A1AFF` đồng bộ:
     - Huy chương hoạt hình 🎖️ và thông báo chúc mừng hoàn thành phần thi.
     - Phiếu xác nhận kết quả: Họ tên, MSSV, Đội thi đấu, Kết quả (Thắng/Thua, Điểm rèn luyện), Mã ván đấu (`matchCode`).
     - Hướng dẫn sinh viên chụp ảnh màn hình để đối soát nhận quà tại Trạm 2.
     - Nút "🛑 ĐÓNG TAB TRÌNH DUYỆT" kèm cảnh báo nhắc nhở tắt tab nếu trình duyệt chặn.
     - Nút "👥 NHƯỜNG LƯỢT / ĐĂNG KÝ BẠN MỚI" đưa về trang đăng ký để truyền máy cho bạn khác thi đấu ngay.

### 3. Kết Quả
- Sinh viên có thể chủ động thoát game chỉ với 1 cú chạm.
- Máy chủ Backend giải phóng kết nối tức thời, sẵn sàng phục vụ 7.000 sinh viên luân phiên mà không bị treo socket.
- Minh chứng kết quả hiển thị rõ ràng, chuyên nghiệp cho công tác cộng điểm rèn luyện.
- **Tinh chỉnh giao diện Phiếu xác nhận:** Đã loại bỏ chữ "Đã lưu database" gây rối mắt, xóa phần "(+10 ĐRL)" / "(+5 ĐRL)" theo yêu cầu, đồng bộ các dòng thông tin thành huy hiệu Neo-Brutalism (Badge) canh đều hai bên, không bị rớt dòng trên điện thoại.
---
## 10. Sửa Lỗi Âm Thanh Đếm Số 3-2-1 Khai Cuộc Trận Đấu
### 1. Hiện Tượng & Nguyên Nhân
1. **Mất nhịp đếm 0 (BẮT ĐẦU KÉO):**
- Trên máy chủ Backend ([`GameRoom.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/GameRoom.js)), vòng lặp đếm ngược chỉ bắn sự kiện `startCountdown` khi `count > 0`. Khi `count = 0`, hàm tự hủy timer và gọi `startMatch()` ngay lập tức mà không bao giờ gửi nhịp `seconds: 0` về cho người chơi.
- Do đó, câu lệnh gọi âm thanh xuất trận `announceStart()` ("Sẵn sàng... Bắt đầu!") và tiếng còi trọng tài bị bỏ qua 100%.
2. **Giao diện tắt đột ngột trước khi xuất trận:**
- Trên Frontend ([`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx)), điều kiện `if (seconds > 0) ... else { setCountdown(null); }` khiến màn hình đếm ngược bị unmount tức thì khi chạm 0, nhảy cụt lủn sang câu hỏi số 1 mà người chơi không kịp thấy màn "0 - BẮT ĐẦU KÉO!".
3. **Âm thanh đếm số 3-2-1 đơn điệu, dễ bị lấn át:**
- Hàm `playCountdown` cũ chỉ phát 1 sóng sine 440Hz ngắn 0.18s giống hệt nhau ở cả 3 số, không có giọng đọc tiếng Việt và bị át bởi nhạc nền BGM dồn dập.
### 2. Giải Pháp Triển Khai
1. **Khắc phục logic gửi nhịp đếm trên Backend ([`GameRoom.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/GameRoom.js)):**
- Bắn thêm sự kiện `START_COUNTDOWN` với `{ seconds: 0 }` để kích hoạt trạng thái "BẮT ĐẦU KÉO!".
- Thêm độ trễ `setTimeout(..., 1200ms)` trước khi load câu hỏi số 1, tạo khoảng đệm hoàn hảo để người chơi nghe trọn vẹn tiếng còi khai trận và giọng MC.
2. **Nâng cấp âm thanh đếm số cao cấp ([`audio.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/utils/audio.js)):**
- Tần số chuông thi đấu tăng dần theo cao độ hồi hộp:
* Số 3: Đô C5 (`523.25 Hz`) + chuông ngân harmonic C6 (`1046 Hz`).
* Số 2: Mi E5 (`659.25 Hz`) + chuông ngân harmonic E6 (`1318 Hz`).
* Số 1: Sol G5 (`783.99 Hz`) + chuông ngân harmonic G6 (`1568 Hz`) căng thẳng cao độ.
* Số 0: Tiếng còi trọng tài (`playWhistle()`) kết hợp hợp âm kèn xuất trận fanfare rực lửa.
3. **Giọng MC đếm số tiếng Việt ([`announcer.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/utils/announcer.js)):**
- Thêm hàm `announceCountdownNumber(num)` đọc dõng dạc "Ba!", "Hai!", "Một!" và khớp với clip âm thanh `start.mp3` ("Sẵn sàng... Bắt đầu!").
4. **Đồng bộ màn hình đếm ([`CountdownOverlay.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/CountdownOverlay.jsx) & [`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx)):**
- Kích hoạt âm thanh và giọng đọc trực tiếp theo từng số, giữ màn hình "BẮT ĐẦU KÉO!" hiển thị trọn vẹn cho tới khi câu hỏi số 1 nạp xong.


---

## 11. Sửa Lỗi Hiển Thị Phòng Đấu Mặc Định 5vs5 Trên Màn Chiếu TV Khi Tạo Phòng 1vs1 Và Chuẩn Hóa Nhận Diện Thương Hiệu Header

### 1. Hiện Tượng & Nguyên Nhân
1. **Phòng đấu luôn hiển thị 5vs5 trên màn chiếu TV:**
   - Khi Ban tổ chức tạo phòng đấu 1vs1 (hoặc 2vs2, 3vs3) từ trang Admin và mở Màn chiếu TV độc lập (`/?tv=ROOM_CODE`), giao diện sảnh chờ LOBBY vẫn hiển thị 5 slot mỗi bên ("Vị trí 1: Chờ thí sinh vào phòng...", ..., "Vị trí 5..."), sân kéo co hiển thị đủ 10 nhân vật Chibi và huy hiệu ghi nhận "CHẾ ĐỘ 5 VS 5".
   - **Nguyên nhân:** Trong [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx), biến `roomState` ban đầu là `null` trước khi kết nối Socket nhận snapshot. Biểu thức tính số lượng lấy fallback `maxPerTeam = roomState?.maxPerTeam || 5`, dẫn tới luôn rơi vào giá trị mặc định 5 người/đội. Đồng thời hàm `fetchRooms()` chỉ lưu dữ liệu vào `rooms` mà chưa cập nhật `roomState`.
   - Trong [`TugOfWarArena.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx), mảng chỉ số nhân vật Chibi trước đây bị gán tĩnh 5 phần tử (`[4, 3, 2, 1, 0]` và `[0, 1, 2, 3, 4]`), không cắt lát theo số lượng thành viên thực tế.
2. **Chưa đồng bộ nhận diện thương hiệu trên Header:**
   - Màn chiếu TV trước đó chứa logo VHU và tiêu đề dài *"KÉO CO TRI THỨC ⚡ MÀN CHIẾU KHÁN GIẢ"*, dòng phụ *"Trạm 1: Thử Thách Trí Tuệ • Trường Đại học Văn Hiến (VHU)"*, khác biệt với phong cách chuẩn hóa ở trang chủ Admin và Phiếu đăng ký sinh viên.

### 2. Giải Pháp Triển Khai
1. **Đồng bộ dữ liệu động 1vs1 -> 5vs5 trên [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx):**
   - Kết hợp nguồn dữ liệu từ danh sách phòng REST API `rooms` và Socket `roomState`:
     ```javascript
     const currentRoomInfo = rooms.find(r => r.roomCode === selectedRoomCode);
     const effectiveMode = roomState?.mode || currentRoomInfo?.mode || '1vs1';
     const maxPerTeam = roomState?.maxPerTeam || currentRoomInfo?.maxPerTeam || (parseInt(effectiveMode[0], 10) || 1);
     const teamAPlayers = roomState?.teamA || currentRoomInfo?.teamAPlayers || [];
     const teamBPlayers = roomState?.teamB || currentRoomInfo?.teamBPlayers || [];
     const teamASlots = Array.from({ length: maxPerTeam }, (_, i) => teamAPlayers[i] || null);
     const teamBSlots = Array.from({ length: maxPerTeam }, (_, i) => teamBPlayers[i] || null);
     const teamACount = maxPerTeam;
     const teamBCount = maxPerTeam;
     ```
   - Nâng cấp `fetchRooms()` để cập nhật trực tiếp `mode` và `maxPerTeam` vào `roomState` ngay khi nhận dữ liệu từ server mà không phải chờ đợi Socket.
   - Sảnh chờ tự động co giãn: Phòng 1vs1 chỉ render 1 slot mỗi bên; phòng 2vs2 render 2 slots; huy hiệu trung tâm tự đổi thành `CHẾ ĐỘ 1 VS 1` và `Đang tập hợp đủ 2 thí sinh để bắt đầu kéo co!`.
2. **Đấu Trường Kéo Co Giữ Trọn Vẹn 5 Nhân Vật Mỗi Bên (10 Chibi y cũ) trên [`TugOfWarArena.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx):**
   - Theo yêu cầu thẩm mỹ và không khí sự kiện: Sàn đấu kéo co trên màn hình TV luôn duy trì đủ 10 nhân vật Chibi biểu diễn (5 bạn Đội A `[4, 3, 2, 1, 0]` đối đầu 5 bạn Đội B `[0, 1, 2, 3, 4]`) bất kể phòng thi đấu ở chế độ 1vs1, 2vs2 hay 5vs5, giúp khung cảnh kéo co trên máy chiếu luôn sôi động, hoành tráng và đẹp mắt nhất.
   - Việc co giãn số lượng thành viên thực tế được thể hiện chuẩn xác tại bảng danh sách slot thành viên của Sảnh chờ LOBBY (1vs1 hiển thị 1 slot/đội, 2vs2 hiển thị 2 slots/đội,...).
3. **Chuẩn hóa Header thương hiệu đồng bộ:**
   - Xóa bỏ logo hình ảnh VHU trên thanh header màn chiếu TV theo đúng yêu cầu.
   - Cập nhật tiêu đề thành: `⚔️ KÉO CO TRI THỨC`.
   - Cập nhật dòng phụ thành: `Trạm 1: Thử Thách Trí Tuệ`.
   - Giữ trọn vẹn màu nền phẳng thuần `#1A1AFF` đặc trưng của Trường Đại học Văn Hiến.


---

## 12. Sửa Lỗi Màn Chiếu TV Bị Kẹt Ở Sảnh Chờ (Không Vào Trận 3-2-1 Dù 2 Thí Sinh Đã Bấm Sẵn Sàng)

### 1. Hiện Tượng & Nguyên Nhân (Root Cause Analysis)
1. **Lỗi logic giữ nguyên dữ liệu cũ trong `fetchRooms()` ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Đoạn mã cũ: `teamA: prev.teamA?.length ? prev.teamA : (targetRoomData.teamAPlayers || [])`.
   - Khi thí sinh vừa vào phòng (trạng thái `isReady: false`), `prev.teamA` đã có độ dài $> 0$. Khi thí sinh bấm "SẴN SÀNG THI ĐẤU" trên điện thoại, backend đã cập nhật `isReady: true`, nhưng biểu thức ternary trên từ chối ghi đè và giữ nguyên mảng cũ `prev.teamA` với `isReady: false`.
   - Kết quả: Huy hiệu thí sinh trên TV bị kẹt vĩnh viễn ở trạng thái `⏳ CHỜ SẴN SÀNG`.
2. **Mất Token xác thực khi mở tab mới (`_blank`):**
   - `AdminPage.jsx` trước đây chỉ lưu `adminToken` vào `sessionStorage`. Do cơ chế bảo mật trình duyệt, `sessionStorage` không được chia sẻ sang tab mới mở qua `window.open()`.
   - Do đó, trang `LiveMatchPage.jsx` trong tab mới bị thiếu token quản trị, nhận lỗi `401 Unauthorized` khi gọi `/api/admin/rooms`.
3. **Thiếu cơ chế chuyển pha thi đấu (`uiState`) trong vòng lặp đồng bộ:**
   - Khi phòng đấu bước vào `COUNTDOWN`, `ROUND_BUZZ` hoặc `ROUND_ANSWER`, hàm `fetchRooms()` cũ chỉ đồng bộ `maxPerTeam` mà không cập nhật `uiState`, khiến màn hình TV vẫn hiển thị giao diện `LOBBY`.
4. **Socket không tự động tham gia phòng khi kết nối lại:**
   - Trong `LiveMatchPage.jsx`, lệnh `socket.emit('joinSpectator')` chỉ gọi 1 lần duy nhất khi component mount. Nếu kết nối socket trễ vài mili-giây hoặc bị ngắt kết nối tạm thời, socket không bao giờ kích hoạt lại sự kiện gia nhập phòng khán giả.

### 2. Giải Pháp Triển Khai Hoàn Thiện
1. **Khắc phục triệt để logic đồng bộ `syncRoomData()` ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Luôn cập nhật danh sách thành viên mới nhất kèm cờ `isReady: true/false` từ server:
     ```javascript
     const newTeamA = targetRoomData.teamAPlayers || targetRoomData.teamA || [];
     const newTeamB = targetRoomData.teamBPlayers || targetRoomData.teamB || [];
     ```
   - Tự động đồng bộ `uiState`: Nếu phòng đang thi đấu (`ROUND_BUZZ`, `ROUND_ANSWER`, `ROUND_REBOUND`), màn hình TV lập tức chuyển sang chế độ câu hỏi 2x2, nạp `currentQuestion`, `deadline`, tỉ số và nơ dây kéo co.
   - Khi phòng bắt đầu đếm số, kích hoạt ngay `CountdownOverlay` (3-2-1 xuất trận).
2. **Bảo toàn Token qua `localStorage` và URL Query Parameter ([`AdminPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/AdminPage.jsx)):**
   - Khi Admin đăng nhập, lưu đồng thời token vào `sessionStorage` và `localStorage`.
   - Khi mở Màn chiếu TV qua nút "Chiếu TV" hoặc "Xem trực tiếp", truyền kèm `&token=${token}` trên URL.
   - `LiveMatchPage.jsx` ưu tiên đọc token từ URL query -> `sessionStorage` -> `localStorage`.
3. **Cung cấp Endpoint Công Khai Cho Màn Chiếu TV ([`rooms.routes.js`](file:///d:/KEOCOTRITHUC/src/backend/src/routes/rooms.routes.js)):**
   - Nâng cấp `GET /api/rooms/:code` trả về đầy đủ snapshot phòng đấu thời gian thực (tỉ số, người chơi, câu hỏi đang hỏi, hạn giờ) mà không yêu cầu token, giúp màn chiếu TV đồng bộ song song 2 kênh (REST API dự phòng 1.5s + WebSocket thời gian thực).
4. **Lắng nghe sự kiện `socket.on('connect')` tự động re-join:**
   - Đảm bảo khi socket kết nối thành công hoặc reconnect, sự kiện `joinSpectator` luôn được bắn lên server để nhận đầy đủ các thông báo `startCountdown`, `newQuestion`, `buzzerAwarded`,...


---

## 13. Sửa Lỗi Màn Chiếu TV Không Cập Nhật Tỉ Số & Bị Lệch Nhịp So Với Điện Thoại Thí Sinh Đang Đấu

### 1. Hiện Tượng & Nguyên Nhân Cốt Lõi (Root Cause Analysis)
1. **Cơ chế `autoFollow` tự ý nhảy phòng:**
   - Trong [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx), biến `autoFollow` mặc định luôn bật `true`.
   - Khi có nhiều phòng trên máy chủ (ví dụ phòng mặc định `KCO1`, phòng cũ `1234`, và phòng mới tạo `1235`), hàm `fetchRooms()` quét danh sách phòng và tự động chọn phòng đầu tiên có trạng thái `ROUND_BUZZ`.
   - Nếu phòng cũ hoặc phòng khác đang có câu hỏi, `autoFollow` lập tức ghi đè `selectedRoomCode` sang phòng đó, khiến Màn Chiếu TV bị "bắt cóc" rời khỏi phòng thi đấu thực tế của 2 thí sinh. Kết quả: Thí sinh trên điện thoại đấu phòng `1235` (tỉ số 2 - 1), trong khi TV chiếu phòng khác (tỉ số 0 - 0, câu hỏi cũ bị đơ ở `0s`).
2. **Thiếu lắng nghe sự kiện `bothTeamsWrong` trên Màn Chiếu TV:**
   - Khi hết 15 giây mà không có đội nào bấm chuông (hoặc cả 2 đội đều trả lời sai), máy chủ bắn sự kiện `bothTeamsWrong`.
   - `LiveMatchPage.jsx` trước đó không đăng ký listener cho sự kiện này, dẫn đến đồng hồ đếm ngược của TV bị dừng ở `0s` mà không cập nhật kết quả và chuyển nhịp sang câu tiếp theo.
3. **Lệch tên trường dữ liệu hiển thị đáp án đúng:**
   - Màn chiếu TV kiểm tra `lastResult.correctAnswer` và `lastResult.correctAnswerIndex`, trong khi Backend trả về `correctOption` và `correctIndex`.
4. **Giao diện thí sinh thiếu huy hiệu mã phòng:**
   - Thí sinh trên điện thoại hoặc máy tính trước đây không thấy mã phòng trên thanh Header, dễ xảy ra trường hợp đăng ký nhầm vào 2 phòng khác nhau (`KCO1` vs `1235`).

### 2. Giải Pháp Triển Khai
1. **Khóa chặt mã phòng được chỉ định (Strict Room Locking):**
   - Khi URL có tham số `?tv=1235` hoặc `?spectate=1235`, biến `autoFollow` tự động tắt `false`.
   - `fetchRooms()` tuyệt đối không tự ý hoán đổi `selectedRoomCode` sang phòng khác.
   - Thêm dropdown chọn phòng thủ công trên thanh Header TV để Ban tổ chức có thể chủ động chuyển phòng khi cần.
2. **Bổ sung trọn vẹn sự kiện `bothTeamsWrong`:**
   - Cập nhật điểm số, độ lệch dây thừng và phát âm thanh thông báo khi cả 2 đội cùng sai hoặc hết giờ bấm chuông.
3. **Chuẩn hóa đối chiếu đáp án đúng:**
   - Hỗ trợ đầy đủ cả `correctOption`, `correctAnswer`, `correctIndex` và `correctAnswerIndex`.
4. **Bổ sung Huy hiệu Mã phòng trên Header Thí sinh ([`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx)):**
   - Thẻ `#1235` màu vàng nổi bật cạnh tên đội `⚡ ĐỘI A` / `🔥 ĐỘI B`, giúp Ban tổ chức và thí sinh đối soát phòng đấu 100% chính xác.

---

## 14. Sửa Lỗi Màn Chiếu TV Bị Biến Thành Màn Hình Thí Sinh (Đơ Tỉ Số 0 - 0 Và Đứng Yên Ở Câu Số 1 Hết Giờ 0s)

### 1. Hiện Tượng Thực Tế
- Thí sinh trên điện thoại thi đấu bình thường, đã sang câu hỏi số 3 ("Ứng dụng học tiếng Anh như Duolingo...") với tỉ số 2 - 1 và dây kéo đã lệch về một bên.
- Tuy nhiên trên máy tính / màn chiếu TV:
  - Header TV (`🔑 PHÒNG: #1234`, `LOA TV: BẬT`, `TỰ BẮT TRẬN: BẬT`) đột ngột biến mất, thay vào đó là Header thí sinh với các nút `🔊 BẬT NHẠC`, `🎙️ MC BẬT`, `Tốt`.
  - Xuất hiện thanh thẻ bài thi đấu: `THẺ: DDoS | X2 Kéo | 50/50 | Tường Lửa` và nhãn `MỤC TIÊU 10đ` (vốn chỉ có trên màn hình thí sinh).
  - Tỉ số bị đơ cứng ở mức 0 - 0, câu hỏi kẹt ở câu số 1 ("Video trên YouTube bị gắn bản quyền..."), đồng hồ dừng ở 0s và 4 đáp án bị khóa 🔒.

### 2. Nguyên Nhân Kỹ Thuật Cốt Lõi (Root Cause Analysis)
1. **Lệnh chuyển trang cưỡng bức trong `App.jsx`:**
   - Trong [`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx), sự kiện `socket.on('newQuestion')` có chứa dòng lệnh:
     ```javascript
     setCurrentPage('GAME');
     ```
   - Khi trận đấu vừa bắt đầu (sau khi đếm ngược 3-2-1 kết thúc), máy chủ bắn sự kiện `newQuestion` về phòng. Socket singleton trên tab TV nhận sự kiện này và ngay lập tức gọi `setCurrentPage('GAME')`.
   - Kết quả: Component màn chiếu TV [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx) bị **unmount hoàn toàn khỏi DOM**, thay vào đó `App.jsx` render component thi đấu của người chơi [`GamePage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/GamePage.jsx).
2. **Tab TV không phải là người chơi hợp lệ:**
   - Vì tab TV mở ra với mục đích trình chiếu cho khán giả nên không có `sessionToken` thí sinh đăng ký, không thuộc Đội A hay Đội B.
   - Khi bị ép vào `GamePage.jsx`, component này không thể xử lý bấm chuông, không nhận được luồng sự kiện riêng của thí sinh, dẫn đến việc bị đông cứng vĩnh viễn ở Câu 1 với thời gian `0s` và tỉ số `0 - 0`.
3. **Xung đột Socket Listeners và Âm thanh kép:**
   - Khi tab TV mở, cả `App.jsx` và `LiveMatchPage.jsx` đều cùng đăng ký lắng nghe các sự kiện socket (`newQuestion`, `buzzerAwarded`, `answerResult`, `bothTeamsWrong`,...). `App.jsx` xử lý theo góc nhìn của thí sinh dẫn đến xung đột âm thanh, lặp giọng đọc MC và làm mất giao diện màn chiếu khán giả.

### 3. Giải Pháp Khắc Phục Triệt Để
1. **Khóa cứng chế độ Màn chiếu Khán giả `isSpectatorMode` ([`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx)):**
   - Nhận diện tab màn chiếu TV thông qua URL query (`?tv=`, `?spectate=`) hoặc hash (`#live`, `#spectate`).
   - Bọc hàm `setCurrentPage`: Nếu `isSpectatorMode === true`, từ chối 100% mọi yêu cầu chuyển trang sang `GAME`, `LOBBY` hay `REGISTER`. Tab màn chiếu TV sẽ được bảo vệ vĩnh viễn ở trạng thái `SPECTATE` (`LiveMatchPage`).
2. **Cô lập toàn bộ Socket Listeners thí sinh trong `App.jsx` ([`App.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/App.jsx)):**
   - Bổ sung rào chắn bảo vệ `if (isSpectatorMode || currentPageRef.current === 'SPECTATE' || currentPageRef.current === 'ADMIN') return;` ở tất cả các sự kiện thi đấu của người chơi:
     - `roomStateUpdate`, `startCountdown`, `newQuestion`, `buzzerAwarded`, `answerResult`
     - `tacticalCardActivated`, `cardEffectApplied`, `fiftyFiftyResult`, `reboundOpen`, `bothTeamsWrong`, `gameOver`, `errorMessage`, `roomResetByAdmin`.
   - Ngăn tab TV tự động gửi sự kiện `resumeSession` người chơi lên máy chủ khi socket kết nối lại.
3. **Độc lập hóa âm thanh TV chuyên dụng:**
   - Toàn bộ âm thanh chuông bấm, còi trọng tài, pháo hoa ăn mừng và giọng MC bình luận trận đấu trên TV do duy nhất [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx) kiểm soát thông qua nút bật/tắt `🔊 LOA TV`, loại bỏ hoàn toàn hiện tượng vọng âm/phát đè từ `App.jsx`.
4. **Bảo toàn hiển thị kết quả đáp án đúng/sai (`ANSWER_RESULT`) trong [`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx):**
   - Trong hàm đồng bộ phòng `syncRoomData()`, khi màn hình TV đang ở trạng thái `ANSWER_RESULT` (chiếu banner chúc mừng đội trả lời đúng và hoạt cảnh kéo dây), cơ chế polling không được ghi đè lùi lại trạng thái trước đó, giúp khán giả xem trọn vẹn 3.5 giây ăn mừng trước khi sang câu hỏi kế tiếp.

---

## 15. Bổ Sung Hiển Thị Tương Tác 4 Thẻ Bài & Bộ Điều Hướng Chuyển Phòng Thi Đấu Khi Kết Thúc Trận

### 1. Hiện Tượng Thực Tế
1. **Thiếu tương tác thẻ bài:** Khi thí sinh trên điện thoại sử dụng 4 thẻ bài chiến thuật (`TƯỜNG LỬA`, `DDOS`, `X2 KÉO`, `50/50`), Màn Chiếu TV không hiển thị hoạt cảnh hiệu ứng và khán giả không biết đội nào đang tung chiêu hay bị đóng băng.
2. **Màn hình trống khi kết thúc trận:** Khi một đội đạt mốc 10 điểm chiến thắng, nửa dưới màn hình TV bị trống trơn một màu xanh `#1A1AFF`, không có bảng tổng kết tỉ số và không có nút để chuyển màn chiếu sang các phòng đấu khác đang hoạt động.

### 2. Nguyên Nhân Kỹ Thuật (Root Cause Analysis)
1. **Lệch cấu trúc thuộc tính `activeCardEffects`:**
   - `LiveMatchPage.jsx` trước đó lưu `activeCardEffects[team] = cardType` (ví dụ: `{ A: 'FIREWALL' }`).
   - Trong khi `TugOfWarArena.jsx` kiểm tra: `activeCardEffects.firewallTeam`, `activeCardEffects.frozenTeam`, `activeCardEffects.doublePullTeam`. Do lệch tên thuộc tính, toàn bộ hiệu ứng lá chắn lửa, khối băng và búa kéo đôi bị vô hiệu hóa. Đồng thời thiếu bộ lắng nghe `cardEffectApplied` khi dính DDoS.
2. **Thiếu khối JSX render cho `uiState === 'FINISHED'`:**
   - Trong `LiveMatchPage.jsx`, nửa dưới màn hình chỉ render khi `uiState === 'LOBBY'` hoặc `uiState !== 'LOBBY' && currentQuestion`. Khi trận kết thúc (`uiState === 'FINISHED'`), `currentQuestion` không còn nên không có bất kỳ component nào được render, dẫn đến khoảng trống màu xanh.

### 3. Giải Pháp Khắc Phục Triệt Để
1. **Chuẩn hóa cấu trúc và hoạt cảnh 4 thẻ bài ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx) & [`TugOfWarArena.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/TugOfWarArena.jsx)):**
   - Đồng bộ chuẩn xác `firewallTeam`, `frozenTeam`, `doublePullTeam` và lắng nghe sự kiện `cardEffectApplied` để kích hoạt hiệu ứng khối băng đối thủ và lá chắn năng lượng trên sân kéo co.
   - Thêm **Pop-up Banner Thông Báo Kích Hoạt Thẻ Bài Siêu Nổi Bật** (3.5 giây) ngay giữa đấu trường kèm âm thanh sôi động khi có thí sinh tung chiêu.
   - Bổ sung **Thanh 4 Huy Hiệu Thẻ Bài Neo-brutalism** (`🛡️ Tường Lửa`, `❄️ DDoS`, `⚖️ X2 Kéo`, `🎯 50/50`) bên dưới vạch năng lượng của từng đội: thẻ còn dùng hiển thị sáng rõ, thẻ đã dùng tự động gạch chéo và làm mờ.
2. **Xây dựng Bảng Tổng Kết Trận Đấu & Vinh Danh Chiến Thắng (Podium Victory):**
   - Khi trận đấu kết thúc (`uiState === 'FINISHED'`), render Cúp vàng 🏆, chúc mừng đội vô địch, hiển thị tỉ số chung cuộc và danh sách thí sinh đạt giải.
3. **Bộ Điều Hướng Chuyển Phòng Thi Đấu (Live Match Switcher):**
   - Liệt kê trực quan danh sách tất cả các phòng đang thi đấu khác kèm mã phòng, chế độ và trạng thái (`⚡ ĐANG ĐẤU (Câu X | SA-SB)`, `⏳ SẢNH CHỜ`).
   - Nút to nổi bật: `👉 XEM PHÒNG ĐANG ĐẤU TIẾP THEO ⏭️` (tự động gợi ý phòng đang diễn ra hấp dẫn nhất).
   - Nút `👁️ CHIẾU PHÒNG NÀY` tại từng thẻ phòng: Bấm một chạm là Màn Chiếu TV lập tức chuyển sang chiếu phòng đó ngay mà không cần reload trang.
4. **Backend Public Endpoint ([`rooms.routes.js`](file:///d:/KEOCOTRITHUC/src/backend/src/routes/rooms.routes.js) & [`api.js`](file:///d:/KEOCOTRITHUC/src/frontend/src/services/api.js)):**
   - Thêm `GET /api/rooms` công khai trả về danh sách các phòng đang chạy để màn chiếu TV luôn tải được danh sách phòng ngay cả khi không có token Admin.


---

## 16. Sửa Lỗi Chớp Tắt Họ Tên/MSSV Sảnh Chờ & Đồng Bộ Khối Thương Hiệu ⚔️ KÉO CO TRI THỨC Theo Hình 2

### 1. Hiện Tượng & Yêu Cầu
1. **Lỗi chớp tắt tại Sảnh chờ:** Thí sinh vào phòng chờ thi đấu thì thông tin Họ tên và MSSV bị giật/chớp tắt liên tục mỗi giây 1 lần trên Màn chiếu TV.
2. **Đồng bộ thương hiệu:** Thay đổi cụm tiêu đề chữ vàng cũ trên Header TV sang khối thẻ thương hiệu chuẩn theo thiết kế Hình 2 (nền thẻ trắng bo cong, biểu tượng `⚔️`, chữ xanh `#1A1AFF` và huy hiệu viên thuốc capsule `Trạm 1: Thử Thách Trí Tuệ`).

### 2. Nguyên Nhân Kỹ Thuật (Root Cause Analysis)
1. **Lệch cấu trúc dữ liệu `faculty` và gọi kép `syncRoomData()`:**
   - Trong vòng lặp 1.000ms của `fetchRooms()`, hàm gọi đồng bộ 2 lần liên tiếp:
     - Lần 1: Lấy `targetRoomData` từ `RoomManager.listRooms()` (thiếu trường `faculty`). Thẻ render chuỗi ngắn: `231A010357`.
     - Lần 2 (ngay sau đó 30ms): Lấy từ API chi tiết `getRoom(selectedRoomCode)` (có trường `faculty: 'CNTT'`). Thẻ render chuỗi dài: `231A010357 • CNTT`.
     - Sự co giãn liên tục này xảy ra mỗi giây làm chữ và khung bị chớp tắt, giật lag.
2. **Re-render DOM vô điều kiện:**
   - Mỗi lần polling tạo ra một mảng đối tượng `teamA` / `teamB` mới dù dữ liệu người chơi không đổi, khiến React unmount và mount lại các phần tử slot.

### 3. Giải Pháp Triển Khai
1. **Chuẩn hóa trường `faculty` ở Backend ([`RoomManager.js`](file:///d:/KEOCOTRITHUC/src/backend/src/game/RoomManager.js)):**
   - Thêm `faculty: p.faculty || ''` vào cả `teamAPlayers` và `teamBPlayers` trong `RoomManager.listRooms()`.
2. **Loại bỏ gọi kép & Thêm bộ so sánh sâu `arePlayersEqual()` ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Khi đã có `selectedRoomCode`, chỉ gọi `syncRoomData` một lần duy nhất từ `getRoom(selectedRoomCode)`.
   - Hàm `arePlayersEqual()` kiểm tra kỹ `studentId`, `name`, `faculty`, `isReady`. Nếu không đổi, giữ nguyên 100% tham chiếu state cũ, triệt tiêu hoàn toàn hiện tượng chớp giật.
   - Giãn chu kỳ polling an toàn thành 2.5 giây (`setInterval(fetchRooms, 2500)`).
3. **Cố định layout slot thí sinh ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Đặt `key={p.studentId || p.socketId || idx}` ổn định.
   - Khóa `minHeight: 52px`, `height: 16px, lineHeight: '16px'` cho dòng MSSV & Khoa, đảm bảo khung thẻ đứng yên tuyệt đối.
4. **Đồng bộ khối thương hiệu White Card Badge chuẩn theo Hình 2 ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Khối thẻ nền trắng Neo-brutalism (`#FFFFFF`, viền đen `2px solid var(--comic-black)`, bóng `0 3px 0 var(--comic-black)`).
   - Biểu tượng thanh kiếm `⚔️`.
   - Chữ hoa `KÉO CO TRI THỨC` màu xanh dương hoàng gia `#1A1AFF` với bóng tím nhạt `#B3B4FF`.
   - Viên thuốc capsule bo tròn `Trạm 1: Thử Thách Trí Tuệ` (nền `#EEF2FF`, viền `#1A1AFF`, chữ xanh `#1010CC`), đồng bộ 100% từ a - z của toàn bộ dự án.


## 17. Sửa Lỗi Cutscene Che Khuất Thanh Chuyển Phòng & Tối Ưu Màn Chiếu TV Trực Tiếp

### 1. Hiện Tượng & Yêu Cầu
- **Hiện tượng:** Khi một trận đấu kết thúc, hiệu ứng Cutscene vinh danh chiến thắng (`VictoryCutscene`) hiển thị toàn màn hình, che khuất hoàn toàn thanh Header, dropdown danh sách phòng và các nút chuyển kênh theo dõi phòng khác.
- Người xem và ban tổ chức không thể chuyển sang xem các phòng thi đấu khác đang diễn ra cho đến khi Cutscene kết thúc hoặc phải tìm nút bỏ qua.
- **Yêu cầu:** Thiết kế lại màn chiếu TV trực tiếp sao cho thanh điều hướng chuyển phòng luôn luôn hiển thị trên cùng, không bị bất kỳ hiệu ứng nào che mất; đồng thời tích hợp trực tiếp nút chuyển nhanh sang phòng thi đấu khác ngay trên Cutscene.

### 2. Nguyên Nhân Kỹ Thuật (Root Cause Analysis)
1. **Lệch tầng hiển thị CSS (`zIndex`):**
   - `VictoryCutscene.jsx` sử dụng `position: 'fixed'`, `inset: 0`, `zIndex: 9999` che trùm toàn bộ viewport trình duyệt.
   - Trong khi đó, `header` của `LiveMatchPage.jsx` chỉ có `zIndex: 30`, dẫn đến toàn bộ thanh điều hướng, dropdown chọn phòng thi đấu và nút tắt bị đè lấp hoàn toàn phía dưới.
2. **Không khớp tên sự kiện callback (`onDone` vs `onFinish`):**
   - `LiveMatchPage.jsx` truyền prop `onFinish={() => setShowCutscene(false)}` trong khi `VictoryCutscene.jsx` lại chỉ khai báo và gọi `onDone()`. Nếu người dùng nhấn bỏ qua hoặc hết giờ, callback không được thực thi đồng nhất.
3. **Thiếu liên kết danh sách phòng trên Cutscene:**
   - Cutscene không nhận dữ liệu về các phòng khác (`otherRooms`), do đó không thể gợi ý cho ban tổ chức biết đang có phòng nào khác đang thi đấu hay ở sảnh chờ.

### 3. Giải Pháp Triển Khai
1. **Đưa Header TV lên tầng hiển thị cao nhất ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Nâng cấp `header` thành `position: 'relative'`, `zIndex: 10001` (vượt trội hơn mọi layer hiệu ứng), giữ thanh thương hiệu `⚔️ KÉO CO TRI THỨC`, dropdown phòng thi đấu và nút `⏭️ XEM PHÒNG #...` luôn luôn tương tác được 100% thời gian.
2. **Đồng bộ callback & bổ sung dữ liệu phòng vào Cutscene ([`LiveMatchPage.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/pages/admin/LiveMatchPage.jsx)):**
   - Truyền đầy đủ cả `onDone`, `onFinish`, `otherRooms` và `onSwitchRoom={handleSwitchRoom}` vào component `<VictoryCutscene>`.
3. **Tối ưu hóa Cutscene & Tích hợp Quick Room Switcher Dock ([`VictoryCutscene.jsx`](file:///d:/KEOCOTRITHUC/src/frontend/src/components/VictoryCutscene.jsx)):**
   - Giảm `zIndex` xuống `1000` và chừa khoảng trống `paddingTop: 76px` để không đè lấp Header.
   - Thêm cơ chế an toàn gọi callback `handleDone()` kích hoạt đồng thời cả `onDone` và `onFinish`.
   - Bổ sung thanh điều hướng chuyển phòng tức thì bên dưới sân đấu Cutscene:
     - Nút `[Bỏ qua Cutscene ⏩]`.
     - Nút `[⚡ CHIẾU PHÒNG #... (Đang thi đấu / Sảnh chờ) ⏭️]` với màu xanh lá `#00E676` nổi bật, click 1 chạm là tự động đóng Cutscene và chuyển ngay sang phòng mới.
