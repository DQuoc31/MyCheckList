# 📋 TÀI LIỆU HƯỚNG DẪN VÀ KỊCH BẢN KIỂM THỬ THỦ CÔNG (MANUAL TESTING GUIDE)

> **Dự án:** MyCheckList (Monorepo Checklist, Calendar & Daily Activity Tracker System)  
> **Phiên bản:** 1.1.0  
> **Cập nhật lần cuối:** 19/09/2026  

---

## 📌 1. Mục đích và Môi trường Chuẩn bị

Tài liệu này cung cấp danh sách đầy đủ các kịch bản kiểm thử thủ công (Manual Test Cases) cho các tính năng giao diện người dùng (UI), luồng tương tác End-to-End (E2E), cơ chế xác thực JWT, lập lịch đa chế độ, theo dõi thói quen & lượng tiêu thụ và tính toàn vẹn dữ liệu đa người dùng.

### 🛠️ Điều kiện Tiền đề (Prerequisites)
1. **Node.js & npm** đã được cài đặt trên máy.
2. **MongoDB Database** đang hoạt động (MongoDB Atlas hoặc MongoDB Local).
3. Khởi động toàn bộ hệ thống bằng lệnh:
   ```powershell
   npm run dev
   ```
4. Truy cập ứng dụng tại: **`http://localhost:5173`** (Frontend) và API tại **`http://localhost:5000`** (Backend).

---

## 🧪 2. Bảng Kịch bản Kiểm thử Thủ công (Manual Test Cases)

### PHẦN I: XÁC THỰC NGƯỜI DÙNG & PHIÊN LÀM VIỆC (AUTH & SESSION)

---

#### 🔹 TC-AUTH-01: Đăng ký tài khoản mới thành công
- **Summary:** Kiểm tra quy trình tạo tài khoản mới từ giao diện AuthPage.
- **Các bước thực hiện:**
  1. Mở trình duyệt tại `http://localhost:5173` (đảm bảo đang ở màn hình Đăng nhập/Đăng ký).
  2. Nhấp vào tab **"Đăng ký"**.
  3. Nhập:
     - **Họ và Tên:** `Nguyễn Văn Test`
     - **Địa chỉ Email:** `testuser01@gmail.com`
     - **Mật khẩu:** `Password@123`
  4. Nhấn nút **"Hoàn tất đăng ký"**.
- **Kết quả kỳ vọng:**
  - Hệ thống hiển thị trạng thái đang xử lý.
  - Sau khi đăng ký thành công, tự động đăng nhập và chuyển thẳng vào Workspace chính.
  - Header hiển thị Avatar chữ `N`, tên `Nguyễn Văn Test` và email `testuser01@gmail.com`.
  - Token JWT được lưu tự động trong `localStorage`.

---

#### 🔹 TC-AUTH-02: Kiểm tra kiểm thực lỗi khi đăng ký (Validation)
- **Summary:** Kiểm tra các thông báo lỗi khi nhập dữ liệu không hợp lệ lúc đăng ký.
- **Các bước thực hiện:**
  1. Ở tab **"Đăng ký"**, để trống ô Họ tên và nhấn Đăng ký.
  2. Nhập mật khẩu dưới 6 ký tự (ví dụ `123`) và nhấn Đăng ký.
  3. Nhập email đã tồn tại trong hệ thống và nhấn Đăng ký.
- **Kết quả kỳ vọng:**
  - Với mật khẩu < 6 ký tự: Hiển thị cảnh báo lỗi *"Mật khẩu phải có ít nhất 6 ký tự"*.
  - Với email đã trùng: Hiển thị thông báo màu đỏ *"Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác"*.

---

#### 🔹 TC-AUTH-03: Đăng nhập tài khoản & Ẩn/Hiện mật khẩu
- **Summary:** Kiểm tra đăng nhập với thông tin đã đăng ký và nút toggle xem mật khẩu.
- **Các bước thực hiện:**
  1. Tại tab **"Đăng nhập"**, nhập email `testuser01@gmail.com`.
  2. Nhập mật khẩu `Password@123`.
  3. Nhấn vào biểu tượng **Con mắt (Eye Icon)** bên phải ô mật khẩu.
  4. Nhấn nút **"Đăng nhập"**.
- **Kết quả kỳ vọng:**
  - Khi nhấn biểu tượng con mắt: Mật khẩu chuyển đổi giữa dạng ẩn `••••••••` và dạng văn bản rõ ràng.
  - Đăng nhập thành công và chuyển vào màn hình chính của tài khoản.

---

#### 🔹 TC-AUTH-04: Tự động phục hồi phiên khi F5 / Mở tab mới
- **Summary:** Đảm bảo người dùng không bị bắt đăng nhập lại sau khi tải lại trang nếu token còn hiệu lực.
- **Các bước thực hiện:**
  1. Đang ở màn hình Workspace sau khi đã đăng nhập.
  2. Nhấn phím **`F5`** (Reload) hoặc mở một tab mới truy cập lại `http://localhost:5173`.
- **Kết quả kỳ vọng:**
  - Ứng dụng tự động đọc token từ `localStorage`, gọi API `/api/auth/me` để lấy thông tin người dùng.
  - Giữ nguyên trạng thái đăng nhập, không văng ra màn hình AuthPage.

---

#### 🔹 TC-AUTH-05: Đăng xuất tài khoản (Logout)
- **Summary:** Kiểm tra việc hủy phiên làm việc và xóa token khi đăng xuất.
- **Các bước thực hiện:**
  1. Nhấn nút **"Đăng xuất"** (icon LogOut) ở góc phải thanh Header.
- **Kết quả kỳ vọng:**
  - Ứng dụng lập tức chuyển về toàn màn hình `AuthPage`.
  - Token trong `localStorage` bị xóa sạch (`null`).
  - Dữ liệu checklist/calendar trên giao diện được dọn dẹp an toàn.

---

### PHẦN II: QUẢN LÝ DANH SÁCH CÔNG VIỆC (CHECKLIST & TASKS)

---

#### 🔹 TC-TASK-01: Tạo Task mới với Sub-tasks và Thuộc tính
- **Summary:** Kiểm tra việc tạo mới công việc kèm các đầu việc con (checklist items), tags và mức độ ưu tiên.
- **Các bước thực hiện:**
  1. Chọn tab **"Checklist"** trên thanh Menu bên trái.
  2. Nhấn nút **"+ Thêm Task Mới"** trên Header.
  3. Điền thông tin:
     - **Tiêu đề:** `Chuẩn bị báo cáo đồ án tốt nghiệp`
     - **Mô tả:** `Rà soát slide và video demo hệ thống`
     - **Mức ưu tiên:** Chọn `HIGH` (Cao)
     - **Tags:** `Report, Slide, University`
     - **Ước tính thời gian:** `120` phút
     - **Sub-tasks:**
       - Thêm mục: `Viết tài liệu Word tổng hợp`
       - Thêm mục: `Thiết kế Slide thuyết trình`
       - Thêm mục: `Quay video hướng dẫn sử dụng`
  4. Nhấn **"Tạo Task"**.
- **Kết quả kỳ vọng:**
  - Modal đóng lại, Task mới xuất hiện đầu danh sách với huy hiệu màu đỏ `HIGH`, thanh tiến độ `0% (0/3 mục)`.

---

#### 🔹 TC-TASK-02: Đánh dấu hoàn thành / Hoàn tác Sub-task (Checkbox Toggle)
- **Summary:** Kiểm tra việc cập nhật trạng thái checklist và thanh phần trăm tiến độ tương ứng.
- **Các bước thực hiện:**
  1. Click vào checkbox của mục `Viết tài liệu Word tổng hợp`.
  2. Quan sát thanh tiến độ của thẻ Task.
  3. Click tiếp vào mục thứ 2 `Thiết kế Slide thuyết trình`.
- **Kết quả kỳ vọng:**
  - Sau bước 1: Thanh tiến độ tăng lên `33% (1/3 mục)`, chữ bị gạch ngang biểu thị đã xong.
  - Sau bước 2: Thanh tiến độ tăng lên `67% (2/3 mục)`. Trạng thái lưu trực tiếp vào cơ sở dữ liệu.

---

#### 🔹 TC-TASK-03: Tìm kiếm và Lọc Task
- **Summary:** Kiểm tra chức năng tìm kiếm từ khóa và lọc task theo trạng thái.
- **Các bước thực hiện:**
  1. Nhập từ khóa `Slide` vào ô tìm kiếm.
  2. Chọn bộ lọc: `Tất cả` $\rightarrow$ `Đang làm` $\rightarrow$ `Đã hoàn thành`.
- **Kết quả kỳ vọng:**
  - Danh sách task tự động lọc mượt mà theo đúng từ khóa và trạng thái được chọn.

---

#### 🔹 TC-TASK-04: Xóa Task
- **Summary:** Kiểm tra việc xóa bỏ một task khỏi danh sách.
- **Các bước thực hiện:**
  1. Nhấn vào biểu tượng **Thùng rác (Trash Icon)** tại góc phải của một task.
  2. Nhấn **OK** khi hộp thoại xác nhận hiện ra.
- **Kết quả kỳ vọng:**
  - Task biến mất khỏi giao diện và bị xóa khỏi MongoDB.

---

### PHẦN III: LẬP LỊCH TRÌNH THEO NGÀY, TUẦN, THÁNG (CALENDAR SCHEDULER)

---

#### 🔹 TC-SCHED-01: Chuyển đổi 3 chế độ xem (Ngày / Tuần / Tháng)
- **Summary:** Kiểm tra việc thay đổi góc nhìn lịch biểu giữa Day View, Week View và Month View.
- **Các bước thực hiện:**
  1. Chọn tab **"Lập lịch"** trên thanh Menu bên trái.
  2. Nhấn nút **"Tuần"** $\rightarrow$ Kiểm tra bảng lưới 7 ngày.
  3. Nhấn nút **"Tháng"** $\rightarrow$ Kiểm tra lịch dạng ô 35 ngày.
  4. Nhấn nút **"Ngày"** $\rightarrow$ Kiểm tra dòng thời gian time-block từ 7:00 đến 21:00.
- **Kết quả kỳ vọng:**
  - Giao diện chuyển đổi tức thì, giữ nguyên dữ liệu các mốc lịch trình.

---

#### 🔹 TC-SCHED-02: Đặt lịch sự kiện vào ngày cụ thể kèm phân loại
- **Summary:** Kiểm tra form tạo sự kiện với ngày tùy chọn và màu sắc phân loại.
- **Các bước thực hiện:**
  1. Nhấn nút **"+ Đặt Lịch Mới"**.
  2. Nhập:
     - **Tiêu đề:** `Họp nhóm Sprint Review`
     - **Ghi chú:** `Tổng kết tiến độ tuần 3`
     - **Ngày diễn ra:** Chọn ngày mai.
     - **Giờ bắt đầu:** `09:30` | **Giờ kết thúc:** `11:00`
     - **Phân loại:** Chọn `Cuộc họp (Meeting)` (Màu vàng/Amber).
  3. Nhấn **"Đặt Lịch"**.
- **Kết quả kỳ vọng:**
  - Sự kiện xuất hiện đúng ô ngày đã chọn trên cả chế độ Tuần và Tháng với nhãn `MEETING` màu vàng.

---

#### 🔹 TC-SCHED-03: Điều hướng thời gian (`<`, `Hôm nay`, `>`)
- **Summary:** Kiểm tra nút tua tuần/tháng và quay về hôm nay.
- **Các bước thực hiện:**
  1. Nhấn nút `>` nhiều lần để xem các tuần/tháng tiếp theo trong tương lai.
  2. Nhấn nút **"Hôm nay"**.
- **Kết quả kỳ vọng:**
  - Tiêu đề tuần/tháng cập nhật chính xác theo từng bước điều hướng.
  - Khi bấm "Hôm nay", lịch lập tức quay về mốc thời gian hiện tại và làm nổi bật ngày hôm nay.

---

#### 🔹 TC-SCHED-04: Lọc lịch trình theo Danh mục (Category Filter)
- **Summary:** Kiểm tra bộ lọc sự kiện theo phân loại công việc.
- **Các bước thực hiện:**
  1. Tại dropdown **"Tất cả danh mục"**, chọn `Công việc`.
  2. Chuyển sang chọn `Sức khỏe`.
- **Kết quả kỳ vọng:**
  - Lịch trình chỉ hiển thị các sự kiện thuộc đúng danh mục đang chọn.

---

### PHẦN IV: THEO DÕI THÓI QUEN & TIÊU THỤ HÀNG NGÀY (HABIT & INTAKE TRACKER)

---

#### 🔹 TC-HABIT-01: Tạo Thói quen nhanh từ Mẫu gợi ý (Preset)
- **Summary:** Kiểm tra tạo thói quen uống nước / giấc ngủ từ các mẫu có sẵn.
- **Các bước thực hiện:**
  1. Chọn mục **"Thói quen & Tiêu thụ"** trên Menu bên trái.
  2. Nhấn nút **"+ Thêm Thói Quen"** trên Header.
  3. Trong danh sách mẫu gợi ý, nhấp vào thẻ **"Uống nước (2000 ml)"**.
  4. Nhấn nút **"Tạo Thói Quen"**.
- **Kết quả kỳ vọng:**
  - Modal đóng lại, thẻ thói quen **"Uống nước mỗi ngày"** xuất hiện với icon giọt nước 💧, mục tiêu `2000 ml`, thanh tiến độ `0 / 2000 ml (0%)` và các nút nạp nhanh `+250 ml`, `+500 ml`.

---

#### 🔹 TC-HABIT-02: Ghi nhận nhanh Lượng tiêu thụ (Quick Log) & Thanh phát sáng
- **Summary:** Kiểm tra nút nạp nhanh và cập nhật thanh tiến độ % trực quan.
- **Các bước thực hiện:**
  1. Tại thẻ "Uống nước mỗi ngày", nhấn nút **`+250 ml`**.
  2. Quan sát lượng nước tăng lên `250 / 2000 ml (13%)`.
  3. Nhấn tiếp nút **`+500 ml`** 3 lần (tổng cộng $250 + 1500 = 1750$ ml).
  4. Nhấn tiếp **`+250 ml`** để đạt $2000$ ml ($100\%$).
- **Kết quả kỳ vọng:**
  - Thanh tiến độ phát sáng chuyển sang trạng thái xanh **`✓ Đã đạt`**.
  - Thẻ tổng quan đầu trang cập nhật **Mục tiêu hoàn thành: 1 / 1 (100%)**.
  - Badge Chuỗi ngày **`🔥 1 ngày`** xuất hiện trên thẻ thói quen.

---

#### 🔹 TC-HABIT-03: Tùy chỉnh nạp số lượng bất kỳ
- **Summary:** Kiểm tra chức năng nhập số lượng tùy ý không nằm trong nút nạp nhanh.
- **Các bước thực hiện:**
  1. Nhấn nút **"Tùy chỉnh..."** trên thẻ thói quen.
  2. Nhập số `350` vào hộp thoại prompt và nhấn OK.
- **Kết quả kỳ vọng:**
  - Lượng tiêu thụ được cộng thêm chính xác `+350` vào tổng lượng của ngày.

---

#### 🔹 TC-HABIT-04: Điều hướng ngày & Nhật ký quá khứ
- **Summary:** Kiểm tra việc xem lại và ghi nhận dữ liệu cho các ngày trước đó.
- **Các bước thực hiện:**
  1. Nhấn nút `<` (Ngày hôm trước) trên bộ chọn ngày.
  2. Kiểm tra tiến độ của ngày hôm qua (mặc định là `0`).
  3. Nạp thử dữ liệu cho ngày hôm qua.
  4. Nhấn nút **"Hôm nay"** để quay về ngày hiện tại.
- **Kết quả kỳ vọng:**
  - Dữ liệu giữa các ngày hoàn toàn độc lập và lưu trữ chuẩn xác theo từng mốc `YYYY-MM-DD`.

---

#### 🔹 TC-HABIT-05: Đặt lại (Reset) lượng tiêu thụ và Xóa thói quen
- **Summary:** Kiểm tra việc reset giá trị ngày về 0 và xóa thói quen.
- **Các bước thực hiện:**
  1. Nhấn biểu tượng **Xoay tròn (RotateCcw Icon)** để đặt lại giá trị ngày hiện tại về 0.
  2. Nhấn biểu tượng **Thùng rác (Trash Icon)** để xóa bỏ thói quen.
- **Kết quả kỳ vọng:**
  - Sau bước 1: Tiến độ ngày quay về `0 / 2000 ml (0%)`.
  - Sau bước 2: Thói quen bị xóa hoàn toàn khỏi cơ sở dữ liệu.

---

### PHẦN V: THỐNG KÊ & BÁO CÁO HIỆU SUẤT (ANALYTICS)

---

#### 🔹 TC-ANLY-01: Kiểm tra độ chính xác của bảng thống kê Analytics
- **Summary:** Đảm bảo các chỉ số % hoàn thành, tổng số task và số sub-items phản ánh đúng thực tế.
- **Các bước thực hiện:**
  1. Chuyển sang tab **"Báo cáo"** (Analytics).
  2. Đối chiếu số liệu:
     - Tổng số việc cần làm.
     - Tỷ lệ hoàn thành (%).
     - Tổng số đầu việc con (Sub-items) đã tích chọn.
     - Số sự kiện lịch trình sắp tới.
- **Kết quả kỳ vọng:**
  - Các chỉ số khớp hoàn toàn với số lượng Task và Checklist thực tế đã tạo ở các phần trước.

---

### PHẦN VI: TÍNH ĐỘC LẬP DỮ LIỆU ĐA NGƯỜI DÙNG (MULTI-USER DATA ISOLATION)

---

#### 🔹 TC-ISO-01: Phân tách dữ liệu giữa các tài khoản khác nhau
- **Summary:** Đảm bảo Người dùng B tuyệt đối không nhìn thấy hoặc can thiệp vào Task/Lịch trình/Thói quen của Người dùng A.
- **Các bước thực hiện:**
  1. Đăng nhập vào tài khoản **User A** (`user_a@test.com`) $\rightarrow$ Tạo task, lịch trình và thói quen uống nước.
  2. Nhấn **"Đăng xuất"**.
  3. Đăng ký/Đăng nhập vào tài khoản **User B** (`user_b@test.com`).
  4. Kiểm tra danh sách Checklist, Lịch biểu, Thói quen và Báo cáo của **User B**.
- **Kết quả kỳ vọng:**
  - Không gian làm việc của **User B** hoàn toàn trống (không có bất kỳ dữ liệu nào của User A).
  - Mọi thao tác tạo mới của User B chỉ lưu riêng cho User B.
