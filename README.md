# VNEWS 24H - BÁO ĐIỆN TỬ TRI THỨC & CÔNG NGHỆ SỐ

Trang web báo tin tức điện tử hiện đại, tối ưu SEO, hỗ trợ đa phương tiện, giao diện chuẩn báo chí cao cấp (Editorial Design), tích hợp đầy đủ hệ thống **xử lý RSS đa nguồn, bóc tách XML thời gian thực, tự động crawl bài viết toàn văn, tìm kiếm không dấu, nghe tin tức tự động bằng giọng nói AI** và quản lý trạng thái tập trung bằng **Redux**.

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
  * Ảnh không có trong RSS được thay bằng ảnh minh họa theo chuyên mục từ Unsplash CDN.
* **Bộ Đệm Dữ Liệu Bộ Nhớ (In-Memory Cache với TTL):**
  * Cache luồng tin RSS 5 phút giúp website phản hồi nhanh và không bị nguồn báo chặn IP.
  * Tự động thu gom và giải phóng các mục hết hạn (Garbage Collection định kỳ 10 phút).
* **Chuyển Đổi Nguồn & Chuyên Mục Linh Hoạt:**
  * Dropdown chọn nguồn báo ngay tại Top Bar và thanh điều hướng danh mục không cần reload trang.
  * **Nhớ nguồn báo đã chọn**, tải lại trang vẫn giữ đúng báo đang đọc (chuyên mục luôn về Trang chủ).
  * Nút làm mới tức thì (`Refresh`) kèm hiệu ứng xoay icon và Skeleton Loading.
  * Tự động làm mới ngầm (Auto-polling) mỗi 5 phút: giữ nguyên số bài đã bấm "Xem thêm", không làm phiền người đọc.
* **Giữ Tin Cũ Khi Mất Kết Nối:** Nếu tải RSS lỗi mà đang có tin của đúng nguồn & chuyên mục thì giữ nguyên tin cũ; chỉ chuyển sang dữ liệu mẫu trong `js/data.js` khi chưa có tin nào.

### 2. Bộ Tự Động Crawl Bài Viết Toàn Văn (Full Article Crawler)
* Khi độc giả bấm vào bất kỳ bài báo nào trên trang:
  * Trình duyệt gọi Endpoint `/api/article?url=...`.
  * Server tự động tải trang HTML bài viết gốc, bóc tách Tiêu đề, Sapo, Tác giả, Thời gian đăng, và **toàn văn nội dung bài báo** (bao gồm toàn bộ các đoạn văn `<p>`, hình ảnh sắc nét `<img>` kèm chú thích `<figcaption>`).
  * Loại bỏ hoàn toàn mã độc, script, quảng cáo, tracking và banner phiền toái.
  * Hiển thị bài viết sạch đẹp trong **Reader Modal** và cung cấp nút mở bài gốc tại tòa soạn.

### 3. Đổ Dữ Liệu RSS Lên Toàn Bộ Giao Diện
* **Breaking News Ticker:** Tự động lấy 8 tin nóng nhất từ luồng RSS đang chọn để chạy dòng chữ khẩn cấp.
* **Bố cục Hero 3 Cột Tiêu Điểm:**
  * *Tâm điểm (Super Hero):* Bài viết đầu bảng với ảnh lớn, tiêu đề sang trọng, sapo và nhãn nguồn tin.
  * *Cột trái (Sub-Heroes):* 2 bài tiêu điểm kế tiếp với nhãn màu chuyên mục.
  * *Cột phải (Dòng sự kiện 24/7):* 6 bài viết mới nhất cập nhật theo mốc thời gian giờ:phút.
* **Lưới Bài Viết Chuyên Mục & Nút Xem Thêm (Load More):**
  * Hiển thị 6 bài đầu tiên, mỗi lần bấm **"Xem Thêm Nhiều Bài Viết"** tải thêm 9 bài mà không cần tải lại trang.
  * Nút hiển thị số bài còn lại, kèm dòng trạng thái "Đang hiển thị X trên tổng số Y bài viết mới nhất".
* **Skeleton Loading Shimmer:** Hiệu ứng khung xám ánh sáng lượn sóng trong lúc đang tải dữ liệu RSS.

### 4. Tìm Kiếm Nhanh Gõ Tới Đâu Ra Tới Đó (Live Search)
* Gõ từ 2 ký tự trở lên là hiện ngay tối đa 8 gợi ý bài viết ngay dưới ô tìm kiếm.
* **Tìm không dấu:** gõ `bong da` hay `BÓNG ĐÁ` đều ra bài "Bóng đá...", từ khớp được tô màu trong tiêu đề.
* Tìm trong **toàn bộ tin RSS đang tải** (kể cả tin chưa bấm "Xem thêm") và **bài đã lưu**, bài khớp tiêu đề được xếp lên trước.
* Hỗ trợ bàn phím: `↑` `↓` chọn bài, `Enter` mở bài, `Esc` xóa từ khóa.

### 5. Nghe Tin Tức Tự Động & Báo Nói AI (Audio Playlist)
* **Danh Sách Phát Tự Động:** Gom tối đa 15 tin mới nhất từ luồng RSS thành danh sách phát, đọc xong bài này tự chuyển sang bài tiếp theo.
* Hết danh sách thì tự làm mới RSS và phát lại từ bài mới nhất.
* Xem danh sách phát, bấm vào bài bất kỳ để nghe ngay, đồng hồ đếm thời gian và visualizer sóng âm động (CSS Sound Wave).
* **Nghe AI Đọc** trong cửa sổ đọc bài: đọc to toàn bộ nội dung vừa crawl bằng giọng tiếng Việt qua Web Speech API.

### 6. Tiện Ích Độc Giả
* **Tùy Chỉnh Cỡ Chữ (A+ / A-):** Tăng giảm cỡ chữ từ 13px đến 25px trong cửa sổ đọc bài, **cỡ chữ được nhớ** sau khi tải lại trang.
* **Chế Độ Sáng / Tối (Dark & Light Theme):** Mặc định theo cài đặt sáng / tối của máy, chỉ lưu lại khi người dùng tự bấm đổi.
* **Quản Lý Bài Viết Đọc Sau (Bookmarks):** Lưu bài viết vào `localStorage`, xem lại trong ngăn kéo "Đã lưu" bất cứ lúc nào.
* **Bình Luận & Bình Chọn:** Viết bình luận dưới bài viết và tham gia bình chọn ở cột bên phải.
* **Báo Mất Kết Nối:** Tự hiện nhãn cảnh báo trên header khi thiết bị mất Internet.

### 7. Widget Thời Tiết & Thị Trường Tài Chính
* **Thời Tiết Theo Vị Trí (Open-Meteo):** Lấy nhiệt độ và tình trạng thời tiết theo vị trí của người dùng; nếu trình duyệt không hỗ trợ hoặc người dùng từ chối định vị thì dùng mặc định TP.HCM.
* **Chỉ Số Tài Chính, Giá Vàng & Tỷ Giá:** Thanh thị trường trên header (VN-Index, vàng SJC, USD), bấm vào để xem bảng chi tiết VN-Index, VN30, vàng SJC, vàng nhẫn, USD/VND, EUR/VND; tự cập nhật mỗi 5 phút.
  > Số liệu tài chính hiện là **dữ liệu mẫu cố định** trong `server.js`, chưa nối với nguồn giá thật.

### 8. Bảo Mật & Hiệu Năng
* **Chặn tải trang lạ (SSRF):** `/api/article` chỉ crawl bài từ 4 tên miền VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí; kiểm tra lại tên miền sau mỗi lần chuyển hướng, giới hạn tối đa 3 lần chuyển hướng và 3MB mỗi trang.
* **Giới hạn số lần gọi (Rate Limit):** Tối đa 40 request / phút / IP cho các API crawl bài viết.
* **Chống chèn mã độc (XSS):** Mọi dữ liệu lấy từ RSS đều được escape trước khi đưa vào giao diện; nội dung bài viết được lọc thêm lần nữa bằng **DOMPurify** ở trình duyệt.
* **Cache Tài Nguyên Tĩnh:** CSS, JS, hình ảnh, icon được trình duyệt giữ 1 ngày (`Cache-Control: max-age=86400`) giúp tải lại trang nhanh hơn.

---

## 🧠 Quản Lý Trạng Thái Bằng Redux

Toàn bộ trạng thái dùng chung của trang nằm trong một store duy nhất ở `js/store.js` (Redux 4.2.1 qua CDN), thay cho các biến toàn cục trước đây.

| Nhánh store | Nội dung | Lưu `localStorage` |
| --- | --- | --- |
| `bookmarks` | Danh sách bài đã lưu | ✅ `vnews-bookmarks` |
| `offline` | Bài lưu kèm toàn văn | ✅ `vnews-offline-articles` |
| `weather` | Vị trí, nhiệt độ, trạng thái đang tải / lỗi | ❌ |
| `preferences` | Theme, cỡ chữ | ✅ `vnews-theme`, `vnews-font-size` |
| `rss` | Nguồn, chuyên mục, danh sách tin, số tin đang hiện, trạng thái tải | ✅ chỉ lưu nguồn báo `vnews-rss-source` |
| `search` | Từ khóa tìm kiếm, bài đang chọn bằng phím | ❌ |

**Cách hoạt động:**
* Muốn thay đổi dữ liệu thì `store.dispatch(actions.xxx())`, không sửa biến trực tiếp.
* Muốn đọc dữ liệu thì `store.getState()`, ví dụ `store.getState().rss.items`.
* Giao diện tự vẽ lại qua `store.subscribe(...)` mỗi khi phần dữ liệu tương ứng thay đổi.
* Việc lưu `localStorage` chỉ nằm ở `store.js`, `app.js` không tự ghi.
* Cài extension **Redux DevTools** cho Chrome để xem từng action và state trước / sau khi debug.

---

## 🚀 Hướng Dẫn Chạy & Trải Nghiệm Cục Bộ

1. Mở cửa sổ dòng lệnh tại thư mục dự án:
   ```bash
   cd d:\Web_bao_tin_tuc
   ```
2. Chạy máy chủ tĩnh & API Server:
   ```bash
   node server.js
   ```
3. Mở trình duyệt và truy cập:
   ```
   http://localhost:3000
   ```

> Yêu cầu Node.js 18+ để sử dụng `fetch` và `AbortController` trên server. Dự án không cần `npm install`, các thư viện (Redux, DOMPurify, Font Awesome) được tải qua CDN nên máy cần có Internet.

### 📁 Cấu Trúc Thư Mục
```
Web_bao_tin_tuc/
├── index.html      # Giao diện trang chủ & các modal
├── server.js       # Server tĩnh + API (RSS, crawl bài, ảnh, tài chính)
├── css/
│   └── style.css   # Toàn bộ giao diện, chế độ sáng / tối, responsive
└── js/
    ├── store.js    # Redux store: actions, reducers, selectors, lưu localStorage
    ├── data.js     # Dữ liệu mẫu (NEWS_DATA) dùng khi RSS lỗi
    └── app.js      # Logic giao diện, chia theo từng phần đánh số
```

### 📡 Danh Sách API Endpoints Cung Cấp
* **Lấy danh sách tin RSS:**
  `GET http://localhost:3000/api/rss?source=vnexpress&category=home`
  *(Hỗ trợ `source`: vnexpress, tuoitre, thanhnien, dantri | `category`: home, thoisu, kinhdoanh, congnghe, thethao, giaitri, doisong)*
* **Crawl toàn văn bài viết:**
  `GET http://localhost:3000/api/article?url=https://vnexpress.net/...`
  *(Chỉ nhận bài từ vnexpress.net, tuoitre.vn, thanhnien.vn, dantri.com.vn)*
* **Danh sách nguồn báo & chuyên mục:**
  `GET http://localhost:3000/api/sources`
* **Proxy ảnh VnExpress:**
  `GET http://localhost:3000/api/image?url=https://...vnecdn.net/...`
* **Chỉ số tài chính, giá vàng & tỷ giá:**
  `GET http://localhost:3000/api/finance`

Server hiện dùng cache trong bộ nhớ 5 phút cho mỗi nguồn/chuyên mục. Thêm `refresh=1` vào URL `/api/rss` để bỏ qua cache. Khi mở một bài RSS, giao diện gọi `/api/article` để lấy nội dung toàn văn và loại bỏ script, style, tracking cùng các thẻ HTML không an toàn trước khi hiển thị.

---

## 🤝 Quy Ước Làm Việc Nhóm

* **Không tạo biến toàn cục mới cho dữ liệu dùng chung** (bài viết, bookmark, nguồn báo...), hãy thêm vào store trong `js/store.js`.
* **Sửa `store.js`, `app.js` hoặc `style.css` thì nhớ tăng `?v=` trong `index.html`** (dùng `Date.now()` làm số version), nếu không trình duyệt sẽ dùng bản cũ trong cache suốt 1 ngày.
* Dữ liệu lấy từ RSS hoặc người dùng nhập trước khi đưa vào `innerHTML` phải đi qua `escapeHtml()`; nội dung bài viết HTML phải đi qua `safeHtml()`.
* Commit theo dạng `feat:` / `fix:` / `update:` / `refactor:` + mô tả ngắn bằng tiếng Việt.
