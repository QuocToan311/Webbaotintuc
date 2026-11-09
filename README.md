# VNEWS 24H - BÁO ĐIỆN TỬ TRI THỨC & CÔNG NGHỆ SỐ

Trang web báo tin tức điện tử hiện đại, tối ưu SEO, hỗ trợ đa phương tiện, giao diện chuẩn báo chí cao cấp (Editorial Design), tích hợp đầy đủ hệ thống **xử lý RSS đa nguồn, bóc tách XML thời gian thực, tự động crawl bài viết toàn văn, phân trang động và đọc báo bằng giọng nói AI**.

---

## 🌟 Các Tính Năng Đã Hiện Thực

### 1. Phân Hệ Xử Lý RSS Đa Nguồn & Bóc Tách XML Thời Gian Thực
* **Hỗ trợ 4 nguồn báo chí hàng đầu Việt Nam:**
  * **VnExpress** (Tin mới nhất, Thời sự, Kinh doanh, Khoa học công nghệ, Thể thao, Giải trí, Đời sống).
  * **Tuổi Trẻ** (Tin mới nhất, Thời sự, Kinh doanh, Nhịp sống số, Thể thao, Giải trí, Văn hóa).
  * **Thanh Niên** (Trang chủ, Thời sự, Kinh tế, Công nghệ, Thể thao, Giải trí, Đời sống).
  * **Dân Trí** (Trang chủ, Xã hội, Kinh doanh, Sức mạnh số, Thể thao, Giải trí, Đời sống).
* **Bộ Phân Tích XML (Balanced Tag & CDATA Parser):**
  * Tự động bóc tách Title, Link, Description, Sapo, Enclosure image, PubDate.
  * Tối ưu ảnh chất lượng cao qua mạng phân phối CDN quốc tế (Unsplash CDN), giải phóng hoàn toàn dung lượng tệp tin cục bộ.
* **Bộ Đệm Dữ Liệu Bộ Nhớ (In-Memory Cache với TTL):**
  * Cache luồng tin RSS 5 phút giúp website phản hồi siêu tốc (< 15ms) và không bị nguồn báo chặn IP.
  * Tự động thu gom và giải phóng các mục hết hạn (Garbage Collection định kỳ 10 phút).
* **Chuyển Đổi Nguồn & Chuyên Mục Linh Hoạt:**
  * Dropdown chọn nguồn báo ngay tại Top Bar và thanh điều hướng danh mục không cần reload trang.
  * Nút làm mới tức thì (`Refresh`) kèm hiệu ứng xoay icon.
  * Tự động làm mới ngầm (Auto-polling) mỗi 5 phút.

### 2. Bộ Tự Động Crawl Bài Viết Toàn Văn (Full Article Crawler)
* Khi độc giả bấm vào bất kỳ bài báo nào trên trang:
  * Trình duyệt gọi Endpoint `/api/article?url=...`.
  * Server tự động tải trang HTML bài viết gốc, bóc tách Tiêu đề, Sapo, Tác giả, Thời gian đăng, và **toàn văn nội dung bài báo** (bao gồm toàn bộ các đoạn văn `<p>`, hình ảnh sắc nét `<img>` kèm chú thích `<figcaption>`).
  * Loại bỏ hoàn toàn mã độc, script, quảng cáo, tracking và banner phiền toái.
  * Hiển thị bài viết sạch đẹp trong **Reader Modal** và cung cấp nút mở bài gốc tại tòa soạn.

### 3. Đổ Dữ Liệu RSS Lên Toàn Bộ Giao Diện & Tính Năng Nâng Cao
* **Breaking News Ticker:** Tự động lấy 8 tin nóng nhất từ luồng RSS đang chọn để chạy dòng chữ khẩn cấp.
* **Bố cục Hero 3 Cột Tiêu Điểm:**
  * *Tâm điểm (Super Hero):* Bài viết đầu bảng với ảnh lớn, tiêu đề sang trọng, sapo và nhãn nguồn tin.
  * *Cột trái (Sub-Heroes):* 2 bài tiêu điểm kế tiếp với nhãn màu chuyên mục.
  * *Cột phải (Dòng sự kiện 24/7):* 6 bài viết mới nhất cập nhật theo mốc thời gian giờ:phút.
* **Lưới Bài Viết Chuyên Mục & Nút Xem Thêm (Load More):**
  * Hỗ trợ nút **"Xem Thêm Tin Tức"** kèm số lượng tin bài còn lại trong luồng RSS.
  * Bấm để tải thêm mượt mà từng đợt 6 bài báo mà không cần tải lại trang.
* **Bộ Lọc Tag Nhanh (Sub-Tags Filter):** Lọc theo các chủ đề nóng: *Tất cả*, *Kinh doanh*, *Công nghệ & AI*, *Thể thao*.
* **Thanh Tiến Trình Đọc Bài (Reading Progress Bar):** Thanh tiến trình gradient chạy dọc đầu cửa sổ khi cuộn xem bài viết trong Reader Modal.
* **Skeleton Loading Shimmer:** Hiệu ứng khung xám ánh sáng lượn sóng trong lúc đang tải dữ liệu RSS.

### 4. Tiện Ích Độc Giả & Đọc Báo Bằng Giọng Nói AI
* **AI Text-To-Speech (Báo Nói Thông Minh):**
  * Nghe đọc to toàn bộ nội dung bài viết vừa crawl được bằng giọng tiếng Việt chuẩn qua Web Speech API.
  * Thanh nghe tin nhanh 60s tích hợp visualizer sóng âm động (CSS Sound Wave).
* **Quản Lý Bài Viết Đọc Sau (Bookmarks Offline):** Lưu bài viết kèm **toàn bộ nội dung đã crawl** vào `localStorage` để có thể mở đọc trọn vẹn ngay cả khi mất mạng.
* **Chế Độ Sáng / Tối (Dark & Light Theme):** Chuyển đổi giao diện tức thì với màu sắc êm dịu cho mắt khi đọc đêm.
* **Tùy Chỉnh Cỡ Chữ (A+ / A-):** Tăng giảm kích thước chữ trong cửa sổ đọc bài.
* **Tìm Kiếm Nhanh (Live Search Filter):** Nhập từ khóa và nhấn Enter để tìm kiếm tức thì trên danh sách tin tức.

---

## 🚀 Hướng Dẫn Chạy & Trải Nghiệm Cục Bộ

1. Mở cửa sổ dòng lệnh tại thư mục dự án:
   ```bash
   cd d:\study\Web_bao_tin_tuc
   ```
2. Chạy máy chủ tĩnh & API Server:
   ```bash
   node server.js
   ```
3. Mở trình duyệt và truy cập:
   ```
   http://localhost:3000
   ```

> Yêu cầu Node.js 18+ để sử dụng `fetch` và `AbortController` trên server. Nếu nguồn RSS tạm thời không phản hồi, giao diện tự động chuyển sang dữ liệu mẫu trong `js/data.js`.

### 📡 Danh Sách API Endpoints Cung Cấp
* **Lấy danh sách tin RSS:**
  `GET http://localhost:3000/api/rss?source=vnexpress&category=home`
  *(Hỗ trợ `source`: vnexpress, tuoitre, thanhnien, dantri | `category`: home, thoisu, kinhdoanh, congnghe, thethao, giaitri, doisong)*
* **Crawl toàn văn bài viết:**
  `GET http://localhost:3000/api/article?url=https://vnexpress.net/...`
* **Danh sách nguồn báo & chuyên mục:**
  `GET http://localhost:3000/api/sources`

Server hiện dùng cache trong bộ nhớ 5 phút cho mỗi nguồn/chuyên mục. Thêm `refresh=1` vào URL `/api/rss` để bỏ qua cache. Khi mở một bài RSS, giao diện gọi `/api/article` để lấy nội dung toàn văn và loại bỏ script, style, tracking cùng các thẻ HTML không an toàn trước khi hiển thị.

---

## 📁 Cấu Trúc Mã Nguồn

```
Web_bao_tin_tuc/
├── index.html            # Khung sườn HTML5 chuẩn SEO (Containers động, Skeleton Shimmer, Progress Bar)
├── server.js             # Máy chủ Node.js (RSS Ingestion, XML Parser, TTL Cache, Web Crawler)
├── css/
   └── style.css         # Hệ thống thiết kế (Tokens, Dark/Light, Layout, Animations, Load More)
├── js/
   ├── data.js           # Dữ liệu dự phòng siêu nhẹ (Offline fallback)
   └── app.js            # Core App (State Management, Data Binding, Crawler, Bookmarks, Audio, Search)
```
