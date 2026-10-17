import psycopg2
import json

questions_data = [
    # --- CÔNG NGHỆ THÔNG TIN (IT) ---
    {
        "category": "IT",
        "question": "Trong kiến trúc mạng máy tính, giao thức nào hoạt động ở tầng Transport và cung cấp truyền dữ liệu tin cậy (có bắt tay 3 bước)?",
        "options": ["UDP", "TCP", "IP", "ICMP"],
        "answer_index": 1,
        "explanation": "TCP (Transmission Control Protocol) là giao thức hướng kết nối, sử dụng cơ chế bắt tay 3 bước (3-way handshake) đảm bảo dữ liệu đến nơi toàn vẹn."
    },
    {
        "category": "IT",
        "question": "Hệ điều hành mã nguồn mở Linux do ai khởi xướng phát triển phiên bản hạt nhân (Kernel) đầu tiên vào năm 1991?",
        "options": ["Linus Torvalds", "Richard Stallman", "Steve Jobs", "Bill Gates"],
        "answer_index": 0,
        "explanation": "Linus Torvalds là tác giả của nhân Linux được phát hành lần đầu năm 1991."
    },
    {
        "category": "IT",
        "question": "Cổng (Port) mặc định của dịch vụ truyền tải siêu văn bản an toàn (HTTPS) là cổng số mấy?",
        "options": ["80", "8080", "443", "22"],
        "answer_index": 2,
        "explanation": "HTTPS mặc định sử dụng cổng 443, trong khi HTTP thường sử dụng cổng 80."
    },
    {
        "category": "IT",
        "question": "Trong cơ sở dữ liệu quan hệ, khóa chính (Primary Key) có đặc điểm nào sau đây?",
        "options": ["Có thể chứa giá trị NULL", "Chỉ được phép là kiểu số nguyên", "Duy nhất và không được chứa giá trị NULL", "Có thể trùng lặp giữa các bản ghi"],
        "answer_index": 2,
        "explanation": "Khóa chính dùng để định danh duy nhất mỗi hàng dữ liệu trong bảng, bắt buộc phải có giá trị duy nhất (Unique) và không rỗng (NOT NULL)."
    },
    {
        "category": "IT",
        "question": "Định dạng dữ liệu JSON là viết tắt của cụm từ nào?",
        "options": ["Java Standard Object Notation", "JavaScript Object Notation", "Java Syntax Object Network", "JavaScript Open Namespace"],
        "answer_index": 1,
        "explanation": "JSON là viết tắt của JavaScript Object Notation - định dạng trao đổi dữ liệu tiêu chuẩn phổ biến."
    },
    {
        "category": "IT",
        "question": "Mô hình ngôn ngữ lớn (LLM) và các hệ thống AI tạo sinh hiện đại chủ yếu dựa trên kiến trúc nào được Google giới thiệu năm 2017?",
        "options": ["Convolutional Neural Network (CNN)", "Recurrent Neural Network (RNN)", "Transformer", "Support Vector Machine (SVM)"],
        "answer_index": 2,
        "explanation": "Kiến trúc Transformer trong bài báo 'Attention Is All You Need' (2017) là nền tảng cốt lõi của GPT, Gemini, BERT..."
    },
    {
        "category": "IT",
        "question": "Trong Git, lệnh nào dùng để tải toàn bộ các commit mới nhất từ kho lưu trữ từ xa (remote) và gộp vào nhánh hiện tại?",
        "options": ["git fetch", "git pull", "git push", "git merge --remote"],
        "answer_index": 1,
        "explanation": "git pull kết hợp cả git fetch (lấy dữ liệu mới) và git merge (gộp vào nhánh cục bộ)."
    },
    {
        "category": "IT",
        "question": "Tấn công mạng dạng DDoS là viết tắt của hình thức tấn công nào?",
        "options": ["Distributed Denial of Service", "Direct Domain of Security", "Decentralized Database of System", "Direct Denial of Software"],
        "answer_index": 0,
        "explanation": "Distributed Denial of Service (Tấn công từ chối dịch vụ phân tán) nhằm làm tê liệt hệ thống mục tiêu bằng lưu lượng truy cập khổng lồ từ nhiều nguồn."
    },
    {
        "category": "IT",
        "question": "Trong CSS, thuộc tính 'display: flex' được kích hoạt để sử dụng mô hình bố cục nào?",
        "options": ["Grid Layout", "Flexible Box Layout", "Float Layout", "Table Layout"],
        "answer_index": 1,
        "explanation": "Flexbox (Flexible Box) là mô hình dàn trang 1 chiều linh hoạt trong CSS."
    },
    {
        "category": "IT",
        "question": "Địa chỉ IPv4 có độ dài bao nhiêu bit?",
        "options": ["16 bit", "32 bit", "64 bit", "128 bit"],
        "answer_index": 1,
        "explanation": "Địa chỉ IPv4 gồm 32 bit (4 byte, ví dụ 192.168.1.1), trong khi IPv6 có 128 bit."
    },
    {
        "category": "IT",
        "question": "Thuật toán sắp xếp nào có độ phức tạp trung bình và trường hợp xấu nhất là O(n log n)?",
        "options": ["Bubble Sort", "Merge Sort", "Quick Sort", "Insertion Sort"],
        "answer_index": 1,
        "explanation": "Merge Sort (Sắp xếp trộn) luôn đảm bảo độ phức tạp thời gian O(n log n) trong mọi trường hợp."
    },
    {
        "category": "IT",
        "question": "Cơ chế nào trong bảo mật xác thực yêu cầu người dùng cung cấp từ 2 yếu tố nhận dạng khác nhau trở lên?",
        "options": ["SSO (Single Sign-On)", "MFA / 2FA (Multi-Factor Authentication)", "RBAC (Role-Based Access Control)", "OAuth 2.0"],
        "answer_index": 1,
        "explanation": "MFA (Xác thực đa yếu tố) kết hợp kiến thức (mật khẩu), sở hữu (mã OTP/điện thoại) hoặc sinh trắc học."
    },
    {
        "category": "IT",
        "question": "Trong lập trình Web thời gian thực (Real-time), giao thức nào cho phép kết nối hai chiều toàn song công (full-duplex) liên tục qua 1 kết nối TCP đơn?",
        "options": ["HTTP Long Polling", "WebSocket", "Server-Sent Events (SSE)", "FTP"],
        "answer_index": 1,
        "explanation": "WebSocket cung cấp kênh truyền dữ liệu hai chiều full-duplex với độ trễ tối thiểu, rất phù hợp cho game và chat trực tiếp."
    },
    {
        "category": "IT",
        "question": "RAM (Random Access Memory) thuộc loại bộ nhớ nào sau đây?",
        "options": ["Bộ nhớ ngoài (Secondary Storage)", "Bộ nhớ khả biến (Volatile Memory - mất dữ liệu khi mất điện)", "Bộ nhớ bất biến (Non-volatile Memory)", "Bộ nhớ chỉ đọc (Read Only Memory)"],
        "answer_index": 1,
        "explanation": "RAM là bộ nhớ khả biến (Volatile), dữ liệu tạm thời sẽ mất khi mất nguồn điện cấp."
    },
    {
        "category": "IT",
        "question": "Ngôn ngữ lập trình nào sau đây thường được ví như 'xương sống' để xử lý logic tương tác trên trình duyệt web?",
        "options": ["Python", "C++", "JavaScript", "Rust"],
        "answer_index": 2,
        "explanation": "JavaScript là ngôn ngữ tiêu chuẩn chạy trực tiếp trên các trình duyệt web hiện đại."
    },

    # --- PHÁP LUẬT ĐỜI SỐNG & AN NINH MẠNG (LAW) ---
    {
        "category": "LAW",
        "question": "Theo Luật An ninh mạng Việt Nam 2018, hành vi nào sau đây là bị nghiêm cấm trên không gian mạng?",
        "options": ["Đăng tải ý kiến phản biện khoa học", "Chia sẻ thông tin sai sự thật, xúc phạm danh dự nhân phẩm người khác", "Tạo nhóm học tập trên mạng xã hội", "Kinh doanh online hợp pháp"],
        "answer_index": 1,
        "explanation": "Điều 8 Luật An ninh mạng 2018 nghiêm cấm đưa thông tin sai sự thật gây hoang mang, xúc phạm danh dự nhân phẩm cá nhân, tổ chức."
    },
    {
        "category": "LAW",
        "question": "Theo Luật Giao thông đường bộ hiện hành, người điều khiển xe mô tô, xe gắn máy khi tham gia giao thông bắt buộc phải có nồng độ cồn trong máu/hơi thở ở mức nào?",
        "options": ["Dưới 0.25 mg/lít khí thở", "Bằng 0 (không có nồng độ cồn)", "Dưới 50 mg/100 ml máu", "Dưới 0.4 mg/lít khí thở"],
        "answer_index": 1,
        "explanation": "Theo Nghị định 100/2019/NĐ-CP và Luật Phòng chống tác hại rượu bia, người điều khiển phương tiện tham gia giao thông bị cấm tuyệt đối có nồng độ cồn (mức 0)."
    },
    {
        "category": "LAW",
        "question": "Độ tuổi tối thiểu để công dân được cấp Căn cước công dân gắn chip hoặc Căn cước theo quy định Luật Căn cước mới nhất là bao nhiêu?",
        "options": ["Từ đủ 14 tuổi", "Dưới 14 tuổi (cấp theo nhu cầu) và từ đủ 14 tuổi (bắt buộc)", "Từ đủ 16 tuổi", "Từ đủ 18 tuổi"],
        "answer_index": 1,
        "explanation": "Luật Căn cước 2023 có hiệu lực từ 1/7/2024 quy định cấp thẻ căn cước cho người từ đủ 14 tuổi (bắt buộc) và dưới 14 tuổi (thực hiện theo nhu cầu)."
    },
    {
        "category": "LAW",
        "question": "Theo Bộ luật Lao động 2019, thời giờ làm việc bình thường của người lao động không quá bao nhiêu giờ trong một ngày?",
        "options": ["Không quá 8 giờ/ngày và 48 giờ/tuần", "Không quá 10 giờ/ngày và 50 giờ/tuần", "Không quá 6 giờ/ngày và 36 giờ/tuần", "Không quá 7 giờ/ngày và 42 giờ/tuần"],
        "answer_index": 0,
        "explanation": "Khoản 1 Điều 105 Bộ luật Lao động 2019 quy định thời giờ làm việc bình thường không quá 08 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần."
    },
    {
        "category": "LAW",
        "question": "Theo Luật Sở hữu trí tuệ, quyền tác giả đối với một tác phẩm phần mềm máy tính phát sinh từ thời điểm nào?",
        "options": ["Từ khi tác phẩm được sáng tạo và thể hiện dưới dạng vật chất nhất định", "Từ khi đăng ký thành công tại Cục Bản quyền tác giả", "Từ khi phát hành thương mại ra thị trường", "Từ khi nộp hồ sơ xin cấp văn bằng bảo hộ"],
        "answer_index": 0,
        "explanation": "Quyền tác giả phát sinh kể từ khi tác phẩm được sáng tạo và được thể hiện dưới một hình thức vật chất nhất định, không bắt buộc phải đăng ký bảo hộ mới phát sinh quyền."
    },
    {
        "category": "LAW",
        "question": "Người từ đủ bao nhiêu tuổi trở lên có đầy đủ năng lực hành vi dân sự theo quy định của Bộ luật Dân sự 2015?",
        "options": ["Từ đủ 16 tuổi", "Từ đủ 18 tuổi", "Từ đủ 20 tuổi", "Từ đủ 21 tuổi"],
        "answer_index": 1,
        "explanation": "Điều 20 Bộ luật Dân sự 2015 quy định: Người thành niên là người từ đủ 18 tuổi trở lên. Người thành niên có năng lực hành vi dân sự đầy đủ, trừ trường hợp luật có quy định khác."
    },
    {
        "category": "LAW",
        "question": "Theo Luật Bảo vệ quyền lợi người tiêu dùng, người tiêu dùng có quyền nào sau đây khi mua phải hàng hóa khuyết tật?",
        "options": ["Được yêu cầu bồi thường thiệt hại và đổi trả, sửa chữa hàng hóa", "Chỉ được hoàn tiền 50%", "Không được khiếu nại nếu đã mở niêm phong", "Bắt buộc phải nhận voucher thay vì hoàn tiền"],
        "answer_index": 0,
        "explanation": "Người tiêu dùng có quyền yêu cầu tổ chức, cá nhân kinh doanh thương lượng, bồi thường thiệt hại, sửa chữa, đổi hàng hóa mới hoặc hoàn lại tiền."
    },
    {
        "category": "LAW",
        "question": "Theo quy định, việc chụp lén hình ảnh nhạy cảm của người khác rồi phát tán lên mạng xã hội có thể bị xử lý như thế nào?",
        "options": ["Chỉ bị nhắc nhở", "Xử phạt vi phạm hành chính hoặc có thể bị truy cứu trách nhiệm hình sự", "Chỉ cần công khai xin lỗi trên Facebook", "Không bị xử phạt nếu không nhằm mục đích kiếm tiền"],
        "answer_index": 1,
        "explanation": "Hành vi xâm phạm đời tư, bôi nhọ danh dự người khác trên mạng có thể bị phạt hành chính theo Nghị định 15/2020/NĐ-CP hoặc truy cứu trách nhiệm hình sự theo Điều 155, 156 Bộ luật Hình sự."
    },
    {
        "category": "LAW",
        "question": "Độ tuổi chịu trách nhiệm hình sự về mọi tội phạm theo quy định của Bộ luật Hình sự Việt Nam là bao nhiêu?",
        "options": ["Từ đủ 14 tuổi trở lên", "Từ đủ 16 tuổi trở lên", "Từ đủ 18 tuổi trở lên", "Từ đủ 21 tuổi trở lên"],
        "answer_index": 1,
        "explanation": "Khoản 1 Điều 12 Bộ luật Hình sự quy định: Người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm, trừ những tội phạm mà Bộ luật này có quy định khác."
    },
    {
        "category": "LAW",
        "question": "Hành vi sử dụng tài khoản ngân hàng của người khác hoặc cho thuê/mượn tài khoản ngân hàng để tiếp tay cho lừa đảo bị xem là gì?",
        "options": ["Hành vi dân sự thông thường", "Hành vi vi phạm pháp luật nghiêm trọng, có thể bị xử phạt hành chính hoặc hình sự đồng phạm", "Hành vi được pháp luật khuyến khích", "Chỉ bị ngân hàng khóa tài khoản"],
        "answer_index": 1,
        "explanation": "Việc mua bán, cho thuê, cho mượn tài khoản thanh toán bị cấm theo Nghị định 52/2024/NĐ-CP và có thể cấu thành tội đồng phạm lừa đảo chiếm đoạt tài sản hoặc rửa tiền."
    }
]

def seed():
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres.jtxbabtgzjyqqvaibdks",
        password="lenhuthao2005tg",
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=6543
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # Check current count
    cur.execute("SELECT COUNT(*) FROM questions;")
    count = cur.fetchone()[0]
    print(f"Current questions count: {count}")
    
    insert_sql = """
        INSERT INTO questions (category, question, options, answer_index, explanation)
        VALUES (%s, %s, %s, %s, %s)
    """
    
    for q in questions_data:
        cur.execute(insert_sql, (
            q["category"],
            q["question"],
            json.dumps(q["options"], ensure_ascii=False),
            q["answer_index"],
            q["explanation"]
        ))
        
    cur.execute("SELECT COUNT(*), category FROM questions GROUP BY category;")
    results = cur.fetchall()
    print("Questions seeded successfully!")
    for r in results:
        print(f" - {r[1]}: {r[0]} câu")
        
    conn.close()

if __name__ == "__main__":
    seed()
