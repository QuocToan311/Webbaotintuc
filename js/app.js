/* ==========================================================================
   VNEWS 24H - Core Application Logic & Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initClockAndDate();
  initTicker();
  initThemeToggle();
  initBookmarks();
  initAudioPlayer();
  initPollWidget();
  initNewsletter();
  initArticleReader();
  initSearch();
  initCategoryNavigation();
});

/* ==========================================================================
   1. Live Clock & Calendar
   ========================================================================== */
function initClockAndDate() {
  const dateEl = document.getElementById('current-date');
  const clockEl = document.getElementById('current-time');
  if (!dateEl) return;

  const daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  function updateTime() {
    const now = new Date();
    const dayName = daysVi[now.getDay()];
    const dateStr = `${dayName}, ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    dateEl.textContent = dateStr;
    if (clockEl) clockEl.textContent = timeStr;
  }

  updateTime();
  setInterval(updateTime, 1000);
}

/* ==========================================================================
   2. Breaking News Ticker
   ========================================================================== */
function initTicker() {
  const tickerText = document.getElementById('ticker-text');
  const btnPrev = document.getElementById('ticker-prev');
  const btnNext = document.getElementById('ticker-next');
  if (!tickerText || !NEWS_DATA.breakingNews.length) return;

  let currentIndex = 0;
  let intervalId = null;

  function showNews(index) {
    tickerText.style.opacity = '0';
    tickerText.style.transform = 'translateY(10px)';
    setTimeout(() => {
      tickerText.textContent = NEWS_DATA.breakingNews[index];
      tickerText.style.opacity = '1';
      tickerText.style.transform = 'translateY(0)';
    }, 200);
  }

  function nextNews() {
    currentIndex = (currentIndex + 1) % NEWS_DATA.breakingNews.length;
    showNews(currentIndex);
  }

  function prevNews() {
    currentIndex = (currentIndex - 1 + NEWS_DATA.breakingNews.length) % NEWS_DATA.breakingNews.length;
    showNews(currentIndex);
  }

  function startAutoPlay() {
    stopAutoPlay();
    intervalId = setInterval(nextNews, 4500);
  }

  function stopAutoPlay() {
    if (intervalId) clearInterval(intervalId);
  }

  showNews(0);
  startAutoPlay();

  if (btnNext) btnNext.addEventListener('click', () => { nextNews(); startAutoPlay(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { prevNews(); startAutoPlay(); });

  tickerText.parentElement.addEventListener('mouseenter', stopAutoPlay);
  tickerText.parentElement.addEventListener('mouseleave', startAutoPlay);
}

/* ==========================================================================
   3. Dark / Light Theme Toggle
   ========================================================================== */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

  const savedTheme = localStorage.getItem('vnews-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vnews-theme', theme);

    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng';
    }
  }
}

/* ==========================================================================
   4. Bookmarks System
   ========================================================================== */
let bookmarks = JSON.parse(localStorage.getItem('vnews-bookmarks') || '[]');

function initBookmarks() {
  const bookmarkBtn = document.getElementById('bookmark-toggle-btn');
  const drawer = document.getElementById('bookmarks-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  updateBookmarkUI();

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', openBookmarksDrawer);
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeBookmarksDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeBookmarksDrawer);
  }
}

function openBookmarksDrawer() {
  const drawer = document.getElementById('bookmarks-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  if (drawer && drawerBackdrop) {
    renderBookmarksList();
    drawer.classList.add('active');
    drawerBackdrop.classList.add('active');
  }
}

function closeBookmarksDrawer() {
  const drawer = document.getElementById('bookmarks-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  if (drawer && drawerBackdrop) {
    drawer.classList.remove('active');
    drawerBackdrop.classList.remove('active');
  }
}

function toggleBookmark(article) {
  const index = bookmarks.findIndex(item => item.id === article.id);

  if (index > -1) {
    bookmarks.splice(index, 1);
    showToast('Đã xóa khỏi danh sách đọc sau');
  } else {
    bookmarks.unshift(article);
    showToast('Đã lưu bài viết vào danh sách đọc sau');
  }

  localStorage.setItem('vnews-bookmarks', JSON.stringify(bookmarks));
  updateBookmarkUI();
}

function updateBookmarkUI() {
  const badge = document.getElementById('bookmark-count');

  if (badge) {
    badge.textContent = bookmarks.length;
  }

  renderBookmarksList();
}

function renderBookmarksList() {
  const listEl = document.getElementById('bookmarks-list');
  if (!listEl) return;

  if (bookmarks.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fa-regular fa-bookmark" style="font-size: 2.5rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
        <p style="font-weight: 600;">Chưa có bài viết nào được lưu</p>
        <p style="font-size: 0.8125rem; margin-top: 0.35rem;">Bấm biểu tượng lưu tại mỗi bài báo để xem lại sau bất cứ lúc nào.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = bookmarks.map(item => `
    <div class="bookmark-item" style="display: flex; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); align-items: center;">
      <div style="flex: 1;">
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-crimson); text-transform: uppercase;">${item.category || 'Tin tức'}</span>
        <h5 style="font-size: 0.85rem; font-weight: 600; line-height: 1.35; margin: 0.2rem 0; cursor: pointer;" onclick="openReaderModalById('${item.id}'); closeBookmarksDrawer();">${item.title}</h5>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${item.readTime || '3 phút đọc'}</span>
      </div>
      <button onclick="toggleBookmark({id: '${item.id}'})" style="color: var(--text-muted); padding: 0.4rem; border-radius: 4px;" title="Xóa">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}
/* ==========================================================================
   5. Interactive Audio Player
   ========================================================================== */
function initAudioPlayer() {
  const playBtn = document.getElementById('audio-play-toggle');
  const container = document.getElementById('audio-highlight-bar');
  const timeDisplay = document.getElementById('audio-time-display');
  if (!playBtn) return;

  let isPlaying = false;
  let seconds = 0;
  let timerInterval = null;

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      if (container) container.classList.add('audio-playing');
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      showToast('Đang phát bản tin tóm tắt 60s...');

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const textToRead = "Đây là bản tin âm thanh nhanh của Thời Báo 24 Giờ. Hôm nay, Hội nghị Thượng đỉnh Trí tuệ Nhân tạo Toàn cầu 2026 chính thức khai mạc. Thị trường chứng khoán thăng hoa vượt mốc 1.288 điểm.";

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.onend = () => stopAudio();

        window.speechSynthesis.speak(utterance);
      }

      timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');

        if (timeDisplay) timeDisplay.textContent = `${mins}:${secs} / 01:00`;

        if (seconds >= 60) stopAudio();
      }, 1000);
    } else {
      stopAudio();
    }
  });

  function stopAudio() {
    isPlaying = false;
    if (container) container.classList.remove('audio-playing');
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    clearInterval(timerInterval);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

/* ==========================================================================
   6. Reader Modal
   ========================================================================== */
let currentArticleData = null;
let currentFontSize = 17;

function initArticleReader() {
  const modal = document.getElementById('reader-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const fontPlusBtn = document.getElementById('font-plus-btn');
  const fontMinusBtn = document.getElementById('font-minus-btn');
  const commentForm = document.getElementById('modal-comment-form');
  const focusBtn = document.getElementById('focus-mode-btn');
  const readerCard = modal?.querySelector('.reader-modal-card');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeReaderModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReaderModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReaderModal();
  });

  // Bật / tắt chế độ đọc tập trung.
  if (focusBtn && readerCard) {
    focusBtn.addEventListener('click', () => {
      const active = readerCard.classList.toggle('focus-mode');

      focusBtn.innerHTML = active
        ? '<i class="fa-solid fa-xmark"></i><span>Thoát chế độ tập trung</span>'
        : '<i class="fa-solid fa-book-open"></i><span>Chế độ đọc tập trung</span>';
    });
  }

  // Tăng cỡ chữ.
  if (fontPlusBtn) {
    fontPlusBtn.addEventListener('click', () => {
      if (currentFontSize < 24) {
        currentFontSize += 2;
        updateArticleFontSize();
      }
    });
  }

  // Giảm cỡ chữ.
  if (fontMinusBtn) {
    fontMinusBtn.addEventListener('click', () => {
      if (currentFontSize > 13) {
        currentFontSize -= 2;
        updateArticleFontSize();
      }
    });
  }

  // Gửi bình luận.
  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const input = document.getElementById('comment-input');
      const authorInput = document.getElementById('comment-author-input');
      const content = input ? input.value.trim() : '';
      const author = authorInput && authorInput.value.trim()
        ? authorInput.value.trim()
        : 'Bạn đọc ẩn danh';

      if (!content) return;

      const commentsList = document.getElementById('modal-comments-list');

      if (commentsList) {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment-card';

        commentEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="comment-author">
              <i class="fa-solid fa-user-circle" style="color:var(--accent-crimson);margin-right:.35rem;"></i>
              ${author}
            </span>
            <span style="font-size:.75rem;color:var(--text-muted);">Vừa xong</span>
          </div>
          <p class="comment-text">${content}</p>
        `;

        commentsList.prepend(commentEl);
      }

      if (input) input.value = '';
      showToast('Bình luận của bạn đã được đăng thành công!');
    });
  }
}

function updateArticleFontSize() {
  const bodyText = document.querySelector('.article-content-text');

  if (bodyText) {
    bodyText.style.fontSize = `${currentFontSize}px`;
  }
}
function openReaderModal(article) {
  currentArticleData = article;

  const modal = document.getElementById('reader-modal');
  if (!modal) return;

  // Reset chế độ đọc tập trung khi mở bài viết mới.
  const readerCard = modal.querySelector('.reader-modal-card');
  if (readerCard) readerCard.classList.remove('focus-mode');

  const focusBtn = document.getElementById('focus-mode-btn');
  if (focusBtn) {
    focusBtn.innerHTML = '<i class="fa-solid fa-book-open"></i><span>Chế độ đọc tập trung</span>';
  }

  document.getElementById('modal-cat-tag').textContent = article.category || 'Tin Tiêu Điểm';
  document.getElementById('modal-title').textContent = article.title;
  document.getElementById('modal-sapo').textContent = article.sapo || '';
  document.getElementById('modal-author').textContent = article.author?.name || 'Ban Biên Tập VNews';
  document.getElementById('modal-date').textContent = article.publishedAt || 'Hôm nay';
  document.getElementById('modal-read-time').textContent = article.readTime || '4 phút đọc';

  const modalImg = document.getElementById('modal-image');

  if (modalImg && article.image) {
    modalImg.src = article.image;
    modalImg.style.display = 'block';
  } else if (modalImg) {
    modalImg.style.display = 'none';
  }

  const modalCaption = document.getElementById('modal-caption');

  if (modalCaption) {
    modalCaption.textContent = article.imageCaption || article.title;
  }

  const modalBody = document.getElementById('modal-body-content');

  if (modalBody) {
    modalBody.innerHTML = article.content || `
      <p>${article.sapo}</p>
      <p>Nội dung chi tiết đang được các phóng viên chiến trường tiếp tục cập nhật theo diễn biến mới nhất của sự kiện...</p>
    `;
  }

  // Hiển thị bình luận.
  const commentsList = document.getElementById('modal-comments-list');

  if (commentsList) {
    if (article.comments && article.comments.length) {
      commentsList.innerHTML = article.comments.map(c => `
        <div class="comment-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="comment-author">
              <i class="fa-solid fa-user-circle" style="color: var(--accent-crimson); margin-right: 0.35rem;"></i>
              ${c.user}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${c.time}</span>
          </div>
          <p class="comment-text">${c.text}</p>
        </div>
      `).join('');
    } else {
      commentsList.innerHTML = `
        <div class="comment-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="comment-author">
              <i class="fa-solid fa-user-circle" style="color: var(--accent-crimson); margin-right: 0.35rem;"></i>
              Nguyễn Văn An
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">25 phút trước</span>
          </div>
          <p class="comment-text">Thông tin rất hữu ích và mang tính thời sự cao. Cảm ơn tòa soạn đã đưa tin nhanh chóng!</p>
        </div>
      `;
    }
  }

  // Mở modal.
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openReaderModalById(id) {
  let article = null;

  if (NEWS_DATA.mainHero.id === id) {
    article = NEWS_DATA.mainHero;
  } else if (NEWS_DATA.eMagazine.id === id) {
    article = NEWS_DATA.eMagazine;
  } else {
    article = NEWS_DATA.subHeroes.find(a => a.id === id) ||
              NEWS_DATA.businessNews.find(a => a.id === id);
  }

  if (!article) {
    article = {
      id: id,
      title: "Tin cập nhật dòng thời sự",
      sapo: "Nội dung tóm tắt cập nhật các sự kiện quan trọng trong ngày.",
      category: "Thời sự",
      publishedAt: "Hôm nay",
      readTime: "3 phút đọc",
      author: { name: "Ban Thời Sự VNews" }
    };
  }

  openReaderModal(article);
}

function closeReaderModal() {
  const modal = document.getElementById('reader-modal');
  if (!modal) return;

  modal.classList.remove('active');

  const readerCard = modal.querySelector('.reader-modal-card');

  if (readerCard) {
    readerCard.classList.remove('focus-mode');
  }

  const focusBtn = document.getElementById('focus-mode-btn');

  if (focusBtn) {
    focusBtn.innerHTML = `
      <i class="fa-solid fa-book-open"></i>
      <span>Chế độ đọc tập trung</span>
    `;
  }

  document.body.style.overflow = '';
}

// Đọc bài viết bằng giọng nói.
function playModalTTS() {
  if (!('speechSynthesis' in window)) {
    showToast('Trình duyệt không hỗ trợ phát giọng nói');
    return;
  }

  window.speechSynthesis.cancel();

  const title = document.getElementById('modal-title').textContent;
  const sapo = document.getElementById('modal-sapo').textContent;

  const utterance = new SpeechSynthesisUtterance(`${title}. ${sapo}`);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;

  window.speechSynthesis.speak(utterance);
  showToast('Đang đọc to bài viết qua giọng AI...');
}

/* ==========================================================================
   7. Interactive Poll Widget
   ========================================================================== */
function initPollWidget() {
  const pollContainer = document.getElementById('poll-widget');
  if (!pollContainer) return;

  const buttons = pollContainer.querySelectorAll('.poll-btn');
  let hasVoted = false;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (hasVoted) {
        showToast('Bạn đã tham gia biểu quyết cho khảo sát này!');
        return;
      }

      hasVoted = true;

      const votes = [64, 26, 10];

      buttons.forEach((b, idx) => {
        const bar = b.querySelector('.poll-bar');
        const percentSpan = b.querySelector('.poll-percent');

        if (bar) bar.style.width = `${votes[idx]}%`;

        if (percentSpan) {
          percentSpan.textContent = `${votes[idx]}%`;
          percentSpan.style.display = 'inline';
        }
      });

      showToast('Cảm ơn bạn đã tham gia khảo sát của Thời Báo!');
    });
  });
}
/* ==========================================================================
   8. Newsletter Subscription (Đăng Ký Nhận Bản Tin)
   ========================================================================== */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
      showToast(`Đã đăng ký nhận bản tin thành công với email: ${emailInput.value}`);
      emailInput.value = '';
    }
  });
}

/* ==========================================================================
   9. Live Search Filter (Tìm Kiếm Tin Tức Nhanh)
   ========================================================================== */
function initSearch() {
  const searchInput = document.getElementById('quick-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const keyword = searchInput.value.trim().toLowerCase();
      if (!keyword) return;

      // Search across our database
      const allNews = [
        NEWS_DATA.mainHero,
        ...NEWS_DATA.subHeroes,
        ...NEWS_DATA.businessNews,
        NEWS_DATA.eMagazine
      ];

      const matched = allNews.find(item =>
        item.title.toLowerCase().includes(keyword) ||
        (item.sapo && item.sapo.toLowerCase().includes(keyword))
      );

      if (matched) {
        openReaderModal(matched);
        showToast(`Tìm thấy bài viết liên quan đến "${keyword}"`);
      } else {
        showToast(`Không tìm thấy bài báo nào khớp với "${keyword}"`);
      }
    }
  });
}

/* ==========================================================================
   10. Category Navigation Filter (Lọc Tin Theo Chuyên Mục)
   ========================================================================== */
function initCategoryNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const label = item.textContent.trim();
      const category = rssCategoryMap[label];
      if (category) {
        e.preventDefault();
        rssCategory = category;
        loadRssFeed(false);
      }
    });
  });
}

/* ==========================================================================
   11. Toast Notification Helper
   ========================================================================== */
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-crimson);"></i> ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ==========================================================================
   12. Hàm gọi thời tiết
   ========================================================================== */
//vị trí mặc định
const DEFAULT_LOCATION = { lat: 10.8231, lon: 106.6297, city: 'TP.HCM'}

function initWeather() {
  if (!navigator.geolocation) {
    //nếu trình duyệt không hỗ trợ định vị => gọi tới vị trí mặc định
    loadWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.city);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      //lấy pos.coords.latitude và pos.coords.longitude rồi gọi loadWeather
      loadWeather(pos.coords.latitude, pos.coords.longitude, 'Vị trí của bạn');
    },
    () => {
      //người dùng từ chối => gọi vị trí mặc định
      loadWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.city);
    },
    { timeout: 8000 }
  );
}

async function loadWeather(lat, lon, city) {
  //ghép URL có lat, lon
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,weather_code&timezone=auto`;

  try {
    //gọi API
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP' + response.status);
    const data = await response.json();

    //lấy dữ liệu thời tiết
    const temp = data.current.temperature_2m;
    const code = data.current.weather_code;

    console.log('Thời tiết: ', city, temp, code); //kiểm tra trong log xem lấy được local và temp chưa
    renderWeather(city, temp, code);

  } catch (error) {
    //báo lỗi
    console.error('Weather failed: ', error);
    document.getElementById('weather-desc').textContent = 'Không tải được';
  }
}

function getWeatherIcon(code) {
  if (code === 0) return { text: 'Trời quang', icon: 'fa-sun'};
  if (code <= 3) return { text: 'Có mây', icon: 'fa-cloud-sun'};
  if (code === 45 || code === 48) return { text: 'Sương mù', icon: 'fa-smog'};
  if (code >= 51 && code <= 57 ) return { text: 'Mưa phùn', icon: 'fa-cloud-rain'};
  if ( (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: 'Mưa', icon: 'fa-cloud-showers-heavy'};
  if ( code >= 95 && code <= 99 ) return { text: 'Mưa dông', icon: 'fa-cloud-bolt'};

  return { text: 'Không rõ', icon: 'fa-cloud' };
}

function renderWeather(city, temp, code) {
  const info = getWeatherIcon(code);

  document.getElementById('weather-city').textContent = city;
  document.getElementById('weather-temp').textContent = Math.round(temp) + '°C';
  document.getElementById('weather-desc').textContent = info.text;
  document.getElementById('weather-icon').className = 'fa-solid ' + info.icon
}