# KẾ HOẠCH & TÀI LIỆU KIẾN TRÚC: KÉO CO TRI THỨC (PHIÊN BẢN 2.0)
> **Web App Game Đối Kháng Thời Gian Thực Trên Thiết Bị Người Chơi (Điện thoại / Laptop)**  
> **Chủ đề:** Công nghệ thông tin (IT) & Pháp luật đời sống (600 câu hỏi trắc nghiệm)  
> **Địa điểm vận hành:** Gian hàng sự kiện chào đón sinh viên / Ngày hội Đoàn - Hội

---

## 📌 PHẦN 1: NHỮNG GÌ ĐÃ THỰC HIỆN ĐƯỢC (TỔNG KẾT TIẾN ĐỘ)

### 1.1. Kiến Trúc Hệ Thống Chuẩn Hóa (Decoupled v2.0)
- **Tách biệt độc lập Frontend & Backend:**
  - `src/backend/`: Node.js, Express, Socket.io, kết nối Supabase Pooler qua `pg` pool.
  - `src/frontend/`: React 18, Vite, Vanilla CSS theo triết lý "Neo-arcade tactile glass".
- **Hạ tầng CSDL Supabase (PostgreSQL Pooler):**
  - Đã kết nối thành công qua cổng Pooler IPv4: `aws-0-ap-southeast-1.pooler.supabase.com:6543`.
  - Cấu trúc bảng CSDL hoàn thiện:
    - `booth_registrations`: Lưu thông tin sinh viên quét mã đăng ký (Họ tên, MSSV, Khoa, SĐT).
    - `questions`: Kho 600 câu hỏi trắc nghiệm (IT & Luật) với 4 phương án, đáp án đúng và giải thích chi tiết.
    - `match_history`: Lưu vết kết quả từng trận đấu (Mã trận, Đội A, Đội B, Tỷ số, Đội thắng, Lý do thắng, thời gian).

### 1.2. Ổn Định Vòng Đời Kết Nối & Đồng Bộ Real-time (Socket.io)
- **Khắc phục lỗi ngắt kết nối giữa chừng:** Duy trì một kết nối Socket.io duy nhất xuyên suốt các màn hình chuyển trang.
- **Loại bỏ triệt để Stale Closures:** Sử dụng `useRef` đồng bộ hóa trạng thái người chơi, phòng đấu, trạng thái nút chuông; đảm bảo 100% callback socket nhận dữ liệu mới nhất.
- **Cô lập phiên theo từng Tab trình duyệt (`sessionStorage`):** Mỗi tab/thiết bị sở hữu một phiên độc lập, cho phép 2 sinh viên hoặc người kiểm thử mở 2 tab song song trên cùng 1 máy tính để đấu Đội A vs Đội B mà không bị trùng lặp hoặc đá nhau ra khỏi phòng.
- **Tự động chuyển hồi phục (Auto-reconnection):** Tự động gửi lại câu hỏi và thời hạn hiện tại nếu người chơi bị rớt mạng hoặc tải lại trang giữa trận.

### 1.3. Giao Diện & Trải Nghiệm Người Dùng (Neo-arcade Tactile Glass)
- **Bố cục 3 tầng tỉ lệ vàng trên di động:**
  - **Tầng 1 (35%): Vũ đài kéo co:** Hiển thị Đội A (⚡ Tia Chớp - Cyan) vs Đội B (🔥 Ngọn Lửa - Cam Lửa), dây thừng co giãn đàn hồi và vạch cờ trung tâm phản ánh tỷ số thời gian thực.
  - **Tầng 2 (25%): Khung câu hỏi:** Phân loại chủ đề `[IT]` hoặc `[PHÁP LUẬT]`, đồng hồ đếm ngược server deadline.
  - **Tầng 3 (40%): Vùng tương tác ngón cái:**
    1. *Chờ bấm chuông:* Nút chuông vàng khổng lồ (165px) hiệu ứng xung nhịp nổi 3D, hỗ trợ phản hồi xúc giác (Haptic Vibration) và âm thanh Web Audio API Synthesizer.
    2. *Đội mình giành quyền:* Lưới 2x2 gồm 4 phương án gắn biểu tượng hình học trực quan (⚪ 🔺 ⏹️ 🔶).
    3. *Đối thủ giành quyền:* Khóa màn hình với thông báo chờ cướp điểm.
    4. *Cơ hội cướp điểm (8 giây):* Viền chớp vàng, phương án đối thủ đã trả lời sai bị gạch chéo đỏ và vô hiệu hóa.
    5. *Kết quả & Kéo dây:* Lớp phủ thông báo Đúng/Sai kèm giải thích kiến thức; kéo giật dây thừng và cộng điểm.
    6. *Vinh danh vô địch:* Hiệu ứng pháo hoa Confetti chúc mừng đội đầu tiên đạt mốc **10 điểm**.

### 1.4. Công Cụ Hỗ Trợ Đấu Thử & Quản Trị
- **Bot Tri Thức 🤖 (Solo Testing):** Bổ sung nút thêm Bot tự động vào đội đối diện với thuật toán bấm chuông (sau 6-8s) và trả lời mô phỏng, giúp 1 người có thể kiểm thử toàn bộ luồng game mà không cần thiết bị thứ 2.
- **Trang Admin Gian Hàng cơ bản:** Đăng nhập bằng `x-admin-key`, thống kê số lượt đăng ký, số trận đấu, số phòng đang chạy, và xuất file CSV danh sách sinh viên.

---

## 🏛️ PHẦN 2: ĐỀ XUẤT NÂNG CẤP MỚI — CƠ CHẾ TẠO PHÒNG BỞI ADMIN & BAN TỔ CHỨC

### 2.1. Mục Tiêu & Định Hướng
Tại gian hàng sự kiện thực tế, sinh viên đến tham gia theo từng nhóm bạn có quy mô khác nhau: có lúc chỉ 2 bạn (1vs1), có lúc nhóm bạn 4 người (2vs2), nhóm bạn cùng phòng 6 người (3vs3) hoặc cả nhóm lớp 10 người (5vs5).

Nhằm **kiểm soát 100% gian hàng**, tránh tình trạng sinh viên tự tạo phòng tràn lan gây nghẽn mạng hoặc vào nhầm phòng của nhau, **toàn quyền tạo phòng thi đấu sẽ do Ban Tổ Chức (BTC / Admin) quản lý trực tiếp**.

### 2.2. Phân Cấp Chế Độ Thi Đấu Do BTC Thiết Lập
Khi tạo phòng trên màn hình Admin, BTC chọn trực tiếp chế độ phù hợp với số lượng sinh viên đang chờ tại quầy:
- 🥊 **Chế độ 1 vs 1:** 1 bạn Đội A vs 1 bạn Đội B (Phòng đủ 2 người).
- 👥 **Chế độ 2 vs 2:** 2 bạn Đội A vs 2 bạn Đội B (Phòng đủ 4 người).
- ⚡ **Chế độ 3 vs 3:** 3 bạn Đội A vs 3 bạn Đội B (Phòng đủ 6 người).
- 🛡️ **Chế độ 4 vs 4:** 4 bạn Đội A vs 4 bạn Đội B (Phòng đủ 8 người).
- 🔥 **Chế độ 5 vs 5:** 5 bạn Đội A vs 5 bạn Đội B (Phòng đủ 10 người).

### 2.3. Quy Trình Vận Hành Tại Gian Hàng (User Journey)
1. **Bước 1 (BTC tạo phòng):**
   - Nhân viên BTC tại gian hàng mở trang Admin, chọn chế độ (ví dụ: `2vs2`).
   - Bấm **"Tạo Phòng Đấu"** ➔ Hệ thống sinh mã phòng ngẫu nhiên 4 ký tự ngắn gọn, dễ nhớ (ví dụ: `#8291`).
   - Màn hình BTC hiển thị mã `#8291` cỡ lớn (kèm mã QR tương ứng để chiếu lên màn hình hoặc đặt tại quầy).
2. **Bước 2 (Sinh viên tham gia):**
   - Sinh viên quét mã QR hoặc truy cập Web App trên điện thoại.
   - Nhập thông tin:
     - **Mã phòng đấu:** Nhập `8291`.
     - **Họ và tên:** *Lê Văn A*.
     - **MSSV:** *21001234*.
     - **Khoa / Viện & Số điện thoại.**
     - **Đội tham gia:** Chọn **Đội A (Tia Chớp)** hoặc **Đội B (Ngọn Lửa)** (hoặc nhập tên nhóm).
   - Bấm **VÀO PHÒNG THI ĐẤU 🚀**.
3. **Bước 3 (Sảnh chờ đồng bộ):**
   - Sinh viên bấm **SẴN SÀNG**: Màn hình điện thoại hoặc laptop của tất cả thành viên cả 2 đội (ví dụ phòng 2vs2 là 4 thành viên) đều hiển thị đầy đủ danh sách người tham gia theo thời gian thực; khi cả 4 thành viên cùng sẵn sàng (hoặc BTC bấm Bắt đầu), trận đấu sẽ lập tức khởi động đếm ngược 3-2-1.
   - BTC trên màn hình quản trị thấy 2 đội đã đủ người ➔ Có thể bấm nút **"BẮT ĐẦU TRẬN ĐẤU NGAY 🚀"** (hoặc tự động đếm ngược 3-2-1 khi cả hai bên đã sẵn sàng).
4. **Bước 4 (Thi đấu giữ nguyên 100% logic cốt lõi):**
   - Trả lời câu hỏi IT & Pháp luật đời sống.
   - Bấm chuông giành quyền trả lời: Ai trong đội nhanh tay bấm trước sẽ mang lại quyền trả lời cho cả đội.
   - Đúng +1 điểm và giật dây; Sai mở quyền cướp điểm 8s cho đội đối thủ.
   - **Đội đạt 10 điểm đầu tiên giành chiến thắng chung cuộc.**

### 2.4. Cơ Chế Kiểm Soát Tính Toàn Vẹn & Chặn Lỗ Hổng Nghiệp Vụ (Đã hoàn thiện)
1. **Khóa nút Bắt đầu khi chưa đủ người hoặc chưa sẵn sàng đủ 100% người chơi:**
   - Backend chặn tuyệt đối `POST /api/admin/rooms/:roomCode/start`: Nếu Đội A hoặc Đội B chưa đạt đủ số lượng `maxPerTeam` theo mode (ví dụ 2vs2 phải đủ 2 bạn mỗi bên) HOẶC còn bất kỳ người chơi nào chưa bấm Sẵn sàng (`isReady === false`), API sẽ từ chối với mã lỗi `NOT_ENOUGH_PLAYERS` hoặc `NOT_ALL_READY`.
   - Màn hình Admin hiển thị rõ ràng:
     - Nếu chưa đủ người: Nút xám mờ `⏳ Đợi đủ người (A: X/N, B: Y/N)`.
     - Nếu đã đủ người nhưng có người chưa sẵn sàng: Nút xám mờ `⏳ Đợi sẵn sàng (X/N người)`.
     - Chỉ khi 100% thành viên (ví dụ đủ 4/4 người trong 2vs2) đều đã bấm "Sẵn sàng", nút mới chuyển sang xanh lá `BẮT ĐẦU TRẬN ĐẤU NGAY 🚀` cho phép BTC bấm bắt đầu.
2. **Chặn đăng ký vào Đội đã đầy người:**
   - Khi sinh viên nhập mã phòng, form tự động kiểm tra số lượng hiện tại của Đội A và Đội B. Nếu đội nào đã đủ số người cho phép, nút chọn đội đó sẽ bị khóa (mờ đi kèm nhãn `🔒 ĐÃ ĐỦ (N/N)`), tự động hướng sinh viên vào đội còn trống.
   - Nếu cả 2 đội đều đã đủ người (`isFull === true`): Khóa nút gửi đăng ký và hiển thị cảnh báo đỏ `⚠️ PHÒNG ĐÃ ĐỦ NGƯỜI CHƠI`.
3. **Tự động điền Mã phòng khi Quét QR:**
   - Trên màn hình Admin, mỗi phòng có nút **`📱 Mã QR quét`** hiển thị mã QR kích thước lớn và link dạng `http://.../?room=8291`.
   - Sinh viên chỉ cần quét camera điện thoại là link tự mở và tự động điền sẵn mã phòng, tự động kiểm tra tính hợp lệ mà không cần gõ tay.
4. **Ngăn chặn trùng MSSV trong cùng một phòng:**
   - Backend kiểm tra nếu sinh viên đã có người mang cùng MSSV đang online trong phòng đó thì từ chối người thứ hai với thông báo `DUPLICATE_MSSV`.
5. **Hủy đếm ngược nếu có người rời phòng:**
   - Nếu phòng đang đếm ngược 3-2-1 mà có sinh viên bị rớt mạng hoặc bấm Rời phòng, hệ thống lập tức hủy đếm ngược và đưa phòng về lại sảnh chờ, cập nhật sĩ số thực tế cho các thành viên còn lại.
6. **Nút Làm mới để đón đợt sinh viên mới (`🔄 Đón lượt mới`):**
   - BTC chỉ cần bấm nút `🔄 Đón lượt mới` trên thẻ phòng: Toàn bộ điểm số được reset về `0 - 0`, người cũ được giải phóng khỏi phòng, giữ nguyên mã phòng để tốp sinh viên tiếp theo vào thi đấu ngay mà không cần tạo mã mới.
7. **Hiển thị duy nhất 1 bộ 4 đáp án & Mở khóa trực tiếp khi bấm chuông:**
   - **Giai đoạn chờ chuông (15 giây):** Toàn bộ 4 phương án lựa chọn (A, B, C, D) được hiển thị trực quan ở trạng thái khóa (🔒). Cả 2 đội vừa đọc câu hỏi vừa xem kỹ 4 đáp án để suy nghĩ. Bên dưới có nút chuông vàng `BẤM CHUÔNG ĐỂ MỞ KHÓA TRẢ LỜI`.
   - **Khi có đội bấm chuông giành quyền:** Nút bấm chuông ẩn đi, **chính 4 đáp án đang có trên màn hình lập tức MỞ KHÓA** thành các nút bấm xúc giác 3D phát sáng viền Neon (Cyan cho người bấm chuông hoặc Vàng cho cướp điểm). Người chơi bấm trực tiếp vào đáp án để trả lời.
   - **Loại bỏ triệt để trùng lặp:** Không sinh thêm hàng nút bấm thứ 2 bên dưới, giữ trải nghiệm trực quan, gọn gàng và thống nhất trên một màn hình duy nhất.
8. **Bảo mật tuyệt đối Form Đăng nhập Admin (Không lưu/hiển thị sẵn tài khoản mật khẩu):**
   - Đã gỡ bỏ 100% dữ liệu tài khoản và mật khẩu điền sẵn (pre-fill) trong mã nguồn và form đăng nhập.
   - Thêm thuộc tính `autoComplete="off"` và `autoComplete="new-password"`. Mọi người dùng khi bấm vào nút BTC đều phải tự nhập tài khoản và mật khẩu quản trị chính xác thì mới được cấp Token truy cập hệ thống.

---

## 🔐 PHẦN 3: CƠ CHẾ QUẢN LÝ TÀI KHOẢN ADMIN & BAN TỔ CHỨC

Để phân quyền bảo mật, thuận tiện cho nhiều cộng tác viên (CTV) cùng trực nhiều ca gian hàng khác nhau, hệ thống sẽ nâng cấp từ mã khóa tĩnh `x-admin-key` sang **Hệ thống Quản lý Tài khoản Admin chuyên nghiệp**:

### 3.1. Thiết Kế CSDL Tài Khoản Admin (`admin_users`)
Thêm bảng `admin_users` vào Supabase:
```sql
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'BOOTH_STAFF', -- 'SUPER_ADMIN' hoặc 'BOOTH_STAFF'
    booth_station VARCHAR(50) DEFAULT 'TRAM_1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

### 3.2. Phân Quyền Vai Trò (Role-based Access Control)
1. **SUPER_ADMIN (Trưởng Ban Tổ Chức / Giảng viên / Quản trị cấp cao):**
   - Tạo, chỉnh sửa và khóa tài khoản của các CTV trực gian hàng.
   - Xem tổng quan toàn bộ số liệu: Tổng số sinh viên đăng ký, tổng số trận, tỷ lệ thắng giữa Đội A và Đội B.
   - Tải file Excel/CSV danh sách sinh viên toàn trường để quay số trúng thưởng.
   - Quản lý ngân hàng câu hỏi (thêm/sửa câu hỏi IT và Luật).
2. **BOOTH_STAFF (Cộng tác viên / Nhân viên trực gian hàng):**
   - Đăng nhập bằng tài khoản ca trực của mình (ví dụ: `ctv_tram1`).
   - Giao diện tối giản, tập trung vào nhiệm vụ:
     - Nút bấm nhanh **Tạo phòng (1v1, 2v2, 3v3, 4v4, 5v5)**.
     - Hiển thị màn hình chờ với mã PIN và QR Code cho sinh viên quét.
     - Giám sát trận đấu và bấm bắt đầu trận.
     - Xem kết quả các trận vừa diễn ra tại gian hàng mình phụ trách.

### 3.3. Phương Thức Đăng Nhập & Bảo Mật
- Mật khẩu được mã hóa bằng thuật toán **bcrypt**.
- Xác thực bằng **JWT (JSON Web Token)** thời hạn 12 - 24 giờ cho ca trực.
- Giao diện có trang Đăng nhập Admin riêng biệt (`/admin/login`), tự động lưu trạng thái đăng nhập an toàn, không sợ bị sinh viên bấm nhầm vào trang quản trị.

---

## 📋 PHẦN 4: LỘ TRÌNH THỰC HIỆN TIẾP THEO

| Bước | Hạng Mục Công Việc | Chi Tiết Kỹ Thuật | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **1** | **Khởi tạo CSDL Tài khoản** | Đã tạo bảng `admin_users` trên Supabase, khởi tạo tài khoản `admin` / `lenhuthao2005tg` (bcrypt). | ✅ ĐÃ HOÀN THÀNH |
| **2** | **Backend API Admin & Quản lý Phòng** | Route `/api/admin/login` (JWT 24h), `/api/admin/rooms/create` (mode 1v1->5v5), `/api/rooms/check/:code`, start match. | ✅ ĐÃ HOÀN THÀNH |
| **3** | **Cập nhật Giao diện Admin** | Bảng điều khiển tạo phòng 1v1->5v5, sinh mã số 4 chữ số, hiển thị danh sách thành viên live, nút Bắt đầu trận đấu. | ✅ ĐÃ HOÀN THÀNH |
| **4** | **Cập nhật Form Đăng ký Sinh viên** | Ô nhập mã phòng bắt buộc, kiểm tra hợp lệ trước khi vào, sảnh chờ hiển thị đầy đủ thành viên cả 2 đội theo thời gian thực. | ✅ ĐÃ HOÀN THÀNH |
| **5** | **Khắc phục Lỗ hổng Nghiệp vụ** | Chặn bắt đầu khi thiếu người, khóa chọn đội khi đầy, chống trùng MSSV, hủy đếm ngược khi rời phòng, làm mới phòng. | ✅ ĐÃ HOÀN THÀNH |
| **6** | **Kịch bản Kiểm thử Thực tế** | Kịch bản chi tiết 6 ca kiểm thử kèm hướng dẫn vận hành cho Ban Tổ Chức tại gian hàng. | ✅ ĐÃ SẴN SÀNG |

---

## 🧪 PHẦN 5: KỊCH BẢN KIỂM THỬ THỰC TẾ & HƯỚNG DẪN VẬN HÀNH GIAN HÀNG

Dưới đây là kịch bản chuẩn giúp 1 người phụ trách kỹ thuật hoặc Ban Tổ Chức có thể tự kiểm thử 100% các tính năng mới và các cơ chế bảo vệ tính toàn vẹn của hệ thống:

### 5.1. Chuẩn Bị Môi Trường Test
- Mở trình duyệt máy tính:
  - **Tab 1 (Ban Tổ Chức):** `http://localhost:5173/admin` (hoặc bấm nút `🏛️ BTC` ở góc phải header).
    - Đăng nhập: `admin` / `lenhuthao2005tg`.
  - **Tab 2 (Sinh viên 1 - Đội A):** `http://localhost:5173` (Tab thường).
  - **Tab 3 (Sinh viên 2 - Đội B):** Mở cửa sổ **Ẩn danh (Incognito)** truy cập `http://localhost:5173`.

---

### 5.2. Kịch Bản Chi Tiết (6 Tình Huống Kiểm Thử)

#### ✅ Ca Test 1: Kiểm thử Tạo Phòng Mới (Chế độ 1vs1 hoặc 2vs2)
1. Trên **Tab 1 (Admin)**:
   - Chọn chế độ: `1vs1` (hoặc `2vs2`).
   - Bấm **"TẠO PHÒNG MỚI"**.
   - Thẻ phòng mới xuất hiện với mã phòng ngẫu nhiên 4 chữ số (ví dụ `#9284`).
   - Bấm nút **`📱 Mã QR quét`**: Màn hình hiển thị mã QR cỡ lớn kèm link chia sẻ `http://localhost:5173/?room=9284` và nút `📋 Sao chép link`.

#### 🛡️ Ca Test 2: Kiểm thử Lỗ hổng Bắt đầu khi chưa đủ người (Đã bị chặn 100%)
1. Khi phòng mới tạo chưa có ai tham gia:
   - Nút bắt đầu trên màn hình Admin ở trạng thái **vô hiệu hóa (xám mờ)**, hiển thị nhãn:
     `⏳ Đợi đủ người (A: 0/1, B: 0/1)`.
   - Admin không thể bấm được nút này.
   - Nếu gọi API trực tiếp bằng Postman/Curl: Backend trả về lỗi HTTP 400 `NOT_ENOUGH_PLAYERS`.

#### 📱 Ca Test 3: Quét QR & Tự động điền Mã Phòng
1. Sao chép link `http://localhost:5173/?room=XXXX` (hoặc mở camera điện thoại quét QR trên màn hình Admin).
2. Dán vào **Tab 2**: Form đăng ký tự động điền mã phòng và hiển thị nhãn xanh `✅ Phòng XXXX hợp lệ (Chế độ 1vs1)`.
3. Nhập:
   - Tên: `Nguyễn Văn A`
   - MSSV: `21001111`
   - Chọn: `Đội A - Tia Chớp`
   - Bấm **"VÀO PHÒNG THI ĐẤU 🚀"** ➔ Vào Sảnh chờ thành công.

#### 🔒 Ca Test 4: Chặn chọn Đội đã đầy người & Chặn trùng MSSV
1. Trên **Tab 3**: Truy cập mã phòng đó.
2. Thấy nút **Đội A** bị khóa mờ với nhãn `🔒 ĐÃ ĐỦ (1/1)`.
3. Hệ thống tự động chuyển lựa chọn sang **Đội B**.
4. Thử cố tình nhập lại MSSV `21001111` ➔ Bấm vào phòng:
   - Backend chặn ngay lập tức và thông báo lỗi: `MSSV 21001111 đã có người đang tham gia trong phòng!`.
5. Đổi sang MSSV `21002222`, Tên `Trần Thị B` ➔ Vào Sảnh chờ Đội B thành công.

#### ⚡ Ca Test 5: Hai Đội Sẵn Sàng & Ban Tổ Chức Ép Bắt Đầu
1. Khi cả 2 tab đều đã vào đủ 2 đội:
   - Nếu 2 sinh viên bấm **"BẤM SẴN SÀNG THI ĐẤU"**: Hệ thống tự động đếm ngược `3-2-1` và chuyển sang vòng đấu câu hỏi trắc nghiệm IT/Luật.
   - Nếu có sinh viên quên bấm Sẵn sàng: Trên màn hình Admin, nút Bắt đầu sẽ chuyển sang màu vàng: `BẮT ĐẦU (BTC ÉP BẮT ĐẦU) ⚡`. BTC bấm một nhát là cả 2 thiết bị lập tức đếm ngược vào trận.

#### 🔄 Ca Test 6: Làm Mới Phòng Đón Tốp Sinh Viên Tiếp Theo (`resetForNewBatch`)
1. Sau khi trận đấu kết thúc (hoặc khi muốn đổi nhóm chơi):
   - Trên màn hình Admin, bấm nút **`🔄 Đón lượt mới`** trên thẻ phòng.
   - Điểm số reset về `0 - 0`, người chơi cũ được giải phóng khỏi phòng, sảnh chờ trở về trạng thái sẵn sàng để tốp sinh viên tiếp theo vào thi đấu ngay lập tức mà không cần tạo mã phòng mới!

---

## 🎨 PHẦN 3: HOÀN THÀNH TOÀN BỘ 4 BƯỚC NÂNG CẤP GIAO DIỆN & TRẢI NGHIỆM (UI/UX OVERHAUL)

Theo đúng định hướng tài liệu kỹ thuật `nâng-cấp-giao-dien.docx`, hệ thống đã triển khai hoàn tất và tích hợp đồng bộ 4 bước nâng cấp:

### 🌟 Bước 1: Chuẩn Hóa UX Core & Hệ Thống Design Tokens
1. **Loại bỏ nhãn gây hiểu nhầm:**
   - Xóa bỏ hoàn toàn cụm "CÂU 25/25" (vốn khiến sinh viên tưởng lầm phải trả lời hết 25 câu).
   - Thay thế bằng huy hiệu vàng nổi bật: **`🎯 MỤC TIÊU 10 ĐIỂM`**, phản ánh chuẩn xác quy luật: "Đội nào chạm mốc 10 điểm trước sẽ thắng ngay lập tức".
2. **Ẩn nút Quản trị BTC khỏi người chơi:**
   - Nút `🏛️ Quản trị BTC` được ẩn hoàn toàn trên giao diện thi đấu của sinh viên, tránh việc người chơi tò mò bấm vào làm gián đoạn trận đấu.
   - Nút chỉ hiển thị khi mở đường dẫn quản trị riêng (`/admin` hoặc `#admin`).
3. **Chống chạm nhầm nút Thoát:**
   - Nút "Thoát phòng" được bọc hộp thoại xác nhận `window.confirm` với cảnh báo rõ ràng để sinh viên không vô tình bấm nhầm khi đang chơi.
4. **Huy hiệu sóng mạng trực quan (Connection Badge):**
   - Loại bỏ con số ms kỹ thuật gây xao nhãng.
   - Thay bằng biểu tượng 3 cột sóng di động:
     - 📶 **3 vạch xanh lá:** Mạng cực tốt (< 80ms).
     - 📶 **2 vạch vàng hổ phách:** Ổn định (< 200ms).
     - 📶 **1 vạch đỏ nhấp nháy:** Mạng yếu (> 200ms) hoặc mất kết nối.
5. **Hệ thống CSS Design Tokens chuẩn hóa (`index.css`):**
   - Bổ sung đầy đủ các token: `--gold-bell` (#FFD600), `--cat-it` (#00F0FF), `--cat-law` (#A78BFA), `--elev-1..3`, `--spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.

### ⏱️ Bước 2: The Juice Engine & Đồng Hồ Vòng SVG (Ring Timer)
1. **Component `RingTimer.jsx`:**
   - Triển khai SVG quét 360 độ siêu mượt theo thời gian thực từ máy chủ.
   - Tự động đổi màu theo mức độ khẩn cấp: Cyan (an toàn) ➔ Vàng hổ phách (còn 50%) ➔ Đỏ rực neon (dưới 3s).
   - Khi thời gian còn dưới 3 giây: Tự động kích hoạt hiệu ứng đập nhịp tim (`heartbeat pulse`) và rung viền cảnh báo khẩn cấp.
2. **Module Juice Engine (`juice.js`):**
   - Điều phối toàn bộ các hiệu ứng phản hồi giác quan: rung chấn nảy màn hình (`triggerScreenShake`), bốc khói tia lửa (`spawnSparks`), rung phản hồi xúc giác tay cầm điện thoại (`triggerHaptic`) và hòa âm Web Audio API Synthesizer.
3. **Chế độ Match Point Tension:**
   - Khi có bất kỳ đội nào đạt 9 điểm (cách chiến thắng 1 điểm), hệ thống tự động bật chế độ **`🔥 MATCH POINT - ĐIỂM QUYẾT ĐỊNH 🔥`** với banner viền chớp và nhạc nền căng thẳng tột độ.

### 🪢 Bước 3: Animated Tug Of War Arena (Vũ Đài Kéo Co Sống Động)
1. **Nhân vật Kéo Co Vector Cyber (`PullerCharacter.jsx`):**
   - Thay thế toàn bộ emoji thô sơ bằng nhân vật vector SVG phong cách arcade hiện đại: trang bị kính bảo hộ Cyber visor phát quang neon, găng tay trợ lực, áo giáp đội (Tia chớp Cyan / Ngọn lửa Cam) và bốt bám đất.
   - Tự động sinh số lượng người kéo đúng theo sĩ số thực tế của đội (từ 1 người đến 5 người tương ứng các chế độ 1vs1 đến 5vs5).
2. **Thanh năng lượng 10 khấc phân đoạn:**
   - 2 thanh năng lượng trên đỉnh khán đài chia thành 10 khấc sáng đèn neon rõ ràng, giúp cả khán giả và người chơi dễ dàng nhận biết đội nào đang dẫn trước bao nhiêu điểm.
3. **Dây thừng đàn hồi & Hiệu ứng giật dây:**
   - Dây thừng liên kết giữa 2 đội co giãn nảy theo đường cong elip với dải nơ cờ đỏ trung tâm.
   - Mỗi lần một đội ghi điểm: Dây thừng giật mạnh sang bên thắng kèm hiệu ứng bốc bụi đất và tia lửa ma sát tóe lên chân các nhân vật kéo co.

### 🏆 Bước 4: Victory Cutscene "Kéo Ngã Đối Thủ" (`VictoryCutscene.jsx`)
1. **Hoạt cảnh chiến thắng 6 giây trên HTML5 Canvas 60 FPS:**
   - Khi có đội chạm mốc 10 điểm, hệ thống lập tức mở toàn màn hình đoạn Cutscene kịch tính:
     - **Giai đoạn 1 (0s - 1.5s):** 2 đội gồng mình giằng co ở ngưỡng cực hạn.
     - **Giai đoạn 2 (1.5s - 3.5s):** Đội thắng dồn toàn lực giật mạnh một cú quyết định; đội thua mất thăng bằng chới với ngã nhào về phía trước.
     - **Giai đoạn 3 (3.5s - 6s):** Đội thắng nhảy lên ăn mừng giơ cao cúp vô địch, pháo hoa kim tuyến Confetti bùng nổ rực rỡ toàn màn hình.
2. **Nút Bỏ Qua Tinh Tế:**
   - Nút `BỎ QUA ▶` xuất hiện sau 1.5 giây để người chơi hoặc BTC có thể tua nhanh nếu muốn vào xem bảng kết quả ngay.
3. **Chuyển tiếp mượt mà sang `VictoryModal`:**
   - Sau khi kết thúc đoạn phim cắt cảnh, màn hình hiển thị bảng vinh danh `VictoryModal` với điểm số chung cuộc, mã trận đấu và thẻ hướng dẫn sinh viên đến quầy nhận quà tại gian hàng.

---

## 📚 PHẦN 4: CẬP NHẬT DỮ LIỆU NGÂN HÀNG CÂU HỎI (300 CÂU PHÁP LUẬT TỪ `Cautracnghiem-luat.docx`)

1. **Làm sạch CSDL cũ:**
   - Đã xóa toàn bộ 25 câu hỏi trắc nghiệm thử nghiệm ban đầu trong bảng `questions`.
   - Đặt lại chỉ số khóa chính `RESTART IDENTITY`.
2. **Trích xuất & Xác thực dữ liệu:**
   - Phân tích và trích xuất chuẩn xác **300 câu hỏi trắc nghiệm** từ file `Cautracnghiem-luat.docx` gồm 6 chủ đề pháp luật đời sống sinh viên:
     - 🚗 *Chủ đề 1:* Giao thông đường bộ (Câu 1–50)
     - 🏙️ *Chủ đề 2:* An ninh trật tự & Đời sống cộng đồng (Câu 51–100)
     - 💼 *Chủ đề 3:* Lao động & Học tập (Câu 101–150)
     - 📱 *Chủ đề 4:* Không gian mạng, mạng xã hội & Quyền riêng tư (Câu 151–200)
     - ⚖️ *Chủ đề 5:* Dân sự, Hợp đồng & Tiêu dùng (Câu 201–250)
     - 🍎 *Chủ đề 6:* An toàn thực phẩm, Y tế & Môi trường (Câu 251–300)
   - Tỷ lệ xác thực: **300 / 300 câu hợp lệ 100%**, có đủ 4 phương án lựa chọn và đáp án đúng.
3. **Cập nhật CSDL Supabase:**
   - Đã nạp thành công toàn bộ 300 câu hỏi vào PostgreSQL (Bảng `questions`, `category = 'LAW'`).
   - Cập nhật logic `getRandomQuestions` để tự động điều tiết và phân phối ngẫu nhiên câu hỏi linh hoạt khi phòng đấu bắt đầu.


