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

