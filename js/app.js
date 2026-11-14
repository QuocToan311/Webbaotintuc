/* ==========================================================================
   VNEWS 24H - Core Application Logic & Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initRssIntegration();
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
  initWeather();
  initNetworkStatusListener();
});

let rssArticles = [];
let rssVisibleCount = 6;
let rssSource = 'vnexpress';
let rssCategory = 'home';
let rssRequestController = null;

const rssCategoryMap = {
  'Thời sự': 'thoisu',
  'Kinh doanh': 'kinhdoanh',
  'Công nghệ AI': 'congnghe',
  'Thể thao': 'thethao',
  'Văn hóa & Đời sống': 'doisong'
};

function initRssIntegration() {
  const sourceSelect = document.getElementById('rss-source-select');
  const refreshBtn = document.getElementById('rss-refresh-btn');
  const loadMoreBtn = document.getElementById('rss-load-more-btn');

  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      rssSource = sourceSelect.value;
      loadRssFeed(true);
    });
  }
  if (refreshBtn) refreshBtn.addEventListener('click', () => loadRssFeed(true));
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => {
    rssVisibleCount += 6;
    renderRssNews();
  });

  loadRssFeed(false);
  setInterval(() => loadRssFeed(false), 5 * 60 * 1000);
}

async function loadRssFeed(forceRefresh) {
  const refreshBtn = document.getElementById('rss-refresh-btn');
  if (rssRequestController) rssRequestController.abort();
  rssRequestController = new AbortController();
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('is-loading');
  }

  try {
    const query = new URLSearchParams({
      source: rssSource,
      category: rssCategory,
      ...(forceRefresh ? { refresh: '1' } : {})
    });
    const response = await fetch(`/api/rss?${query}`, { signal: rssRequestController.signal });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Không thể tải RSS');
    rssArticles = result.items.map(normalizeRssArticle);
    rssVisibleCount = 6;
    NEWS_DATA.breakingNews = rssArticles.slice(0, 8).map(item => item.title);
    renderRssNews();
    showToast(`Đã cập nhật ${rssArticles.length} tin từ ${result.source}`);
  } catch (error) {
    if (error.name !== 'AbortError') {
      rssArticles = getFallbackArticles();
      rssVisibleCount = 6;
      renderRssNews();
      showToast(`RSS tạm thời không khả dụng, đang dùng dữ liệu mẫu`);
      console.error('RSS loading failed:', error);
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('is-loading');
    }
  }
}

function normalizeRssArticle(item) {
  return {
    ...item,
    image: decodeXmlEntities(item.image || ''),
    category: item.category || 'Tin tức',
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleString('vi-VN') : 'Mới cập nhật',
    readTime: '3 phút đọc',
    author: { name: item.source || 'Nguồn RSS' }
  };
}

function getFallbackArticles() {
  return [NEWS_DATA.mainHero, ...NEWS_DATA.subHeroes, ...NEWS_DATA.businessNews].map(item => ({
    ...item,
    link: item.link || '',
    source: 'Dữ liệu mẫu'
  }));
}

function renderRssNews() {
  const visible = rssArticles.slice(0, rssVisibleCount);
  if (!visible.length) return;

  const hero = visible[0];
  const subHeroes = visible.slice(1, 3);
  const feed = visible.slice(3, 9);
  const heroImg = document.querySelector('.main-hero-media img');
  const heroTitle = document.querySelector('.main-hero-title');
  const heroSapo = document.querySelector('.main-hero-sapo');
  if (heroImg && hero.image) heroImg.src = imageUrl(hero.image);
  if (heroTitle) {
    heroTitle.textContent = hero.title;
    heroTitle.onclick = () => openReaderModal(hero);
  }
  if (heroSapo) heroSapo.textContent = hero.sapo || '';
  const heroMedia = document.querySelector('.main-hero-media');
  if (heroMedia) heroMedia.onclick = () => openReaderModal(hero);
  const subContainer = document.querySelector('.sub-hero-col');
  if (subContainer) {
    subContainer.innerHTML = subHeroes.map(article => `
      <article class="sub-hero-card" data-rss-id="${escapeAttribute(article.id)}">
        <div class="card-media">
          <span class="category-tag blue">${escapeHtml(article.category)}</span>
          <img src="${escapeAttribute(imageUrl(article.image || fallbackImage(article)))}" alt="${escapeAttribute(article.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'">
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(article.title)}</h3>
          <div class="card-meta"><span class="time-read"><i class="fa-regular fa-clock"></i> ${escapeHtml(article.publishedAt)}</span><span>${escapeHtml(article.source || '')}</span></div>
        </div>
      </article>
    `).join('');
    subContainer.querySelectorAll('[data-rss-id]').forEach(card => card.addEventListener('click', () => openReaderModal(findRssArticle(card.dataset.rssId))));
  }
  const feedContainer = document.getElementById('feed-list-container');
  if (feedContainer) {
    feedContainer.innerHTML = feed.map(article => `
      <div class="feed-item" data-rss-id="${escapeAttribute(article.id)}">
        <span class="feed-item-time">${escapeHtml(article.publishedAt)}</span>
        <p class="feed-item-title">${escapeHtml(article.title)}</p>
      </div>
    `).join('');
    feedContainer.querySelectorAll('[data-rss-id]').forEach(item => item.addEventListener('click', () => openReaderModal(findRssArticle(item.dataset.rssId))));
  }
  const grid = document.getElementById('rss-news-grid');
  if (grid) {
    grid.innerHTML = visible.map(article => `
      <article class="news-card" data-rss-id="${escapeAttribute(article.id)}">
        <div class="card-media"><span class="category-tag blue">${escapeHtml(article.category)}</span><img src="${escapeAttribute(imageUrl(article.image || fallbackImage(article)))}" alt="${escapeAttribute(article.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'"></div>
        <div class="card-body"><h3 class="card-title">${escapeHtml(article.title)}</h3><p class="card-sapo">${escapeHtml(article.sapo || '')}</p><div class="card-meta"><span>${escapeHtml(article.publishedAt)}</span><span>${escapeHtml(article.source || '')}</span></div></div>
      </article>
    `).join('');
    grid.querySelectorAll('[data-rss-id]').forEach(card => card.addEventListener('click', () => openReaderModal(findRssArticle(card.dataset.rssId))));
  }
  const loadMoreBtn = document.getElementById('rss-load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.hidden = rssVisibleCount >= rssArticles.length;
    loadMoreBtn.textContent = `Xem thêm tin tức (${Math.max(rssArticles.length - rssVisibleCount, 0)})`;
  }
}

function findRssArticle(id) {
  return rssArticles.find(article => article.id === id) || getFallbackArticles().find(article => article.id === id) || rssArticles[0];
}

function fallbackImage(article) {
  const cat = (article?.category || '').toLowerCase();
  if (cat.includes('kinh') || cat.includes('tài')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('công') || cat.includes('khoa') || cat.includes('ai')) {
    return 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('thao')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80';
}

function imageUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(decodeXmlEntities(url), window.location.href);
    return parsed.hostname.endsWith('vnecdn.net')
      ? `/api/image?url=${encodeURIComponent(parsed.href)}`
      : parsed.href;
  } catch {
    return '';
  }
}

function decodeXmlEntities(value) {
  return String(value).replace(/&amp;/g, '&');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}

function safeHtml(html = '') {
  if (!window.DOMPurify) return escapeHtml(html); // CDN lỗi thì hiện dạng chữ thường
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'h2', 'h3', 'blockquote', 'figure', 'figcaption', 'img'],
    ALLOWED_ATTR: ['src', 'alt', 'title', 'loading']
  });
}


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
   4. Bookmarks & Offline Reading System
   ========================================================================== */
let bookmarks = JSON.parse(localStorage.getItem('vnews-bookmarks') || '[]');
let offlineArticles = JSON.parse(localStorage.getItem('vnews-offline-articles') || '[]');

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

    listEl.innerHTML = bookmarks.map(item => {
    const isOffline = offlineArticles.some(off => off.id === item.id);
    return `
    <div class="bookmark-item" style="display: flex; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); align-items: center;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-crimson); text-transform: uppercase;">${escapeHtml(item.category || 'Tin tức')}</span>
          ${isOffline ? '<span class="offline-status-badge"><i class="fa-solid fa-cloud-arrow-down"></i> Sẵn sàng đọc Offline</span>' : ''}
        </div>
        <h5 class="bookmark-open" data-id="${escapeAttribute(item.id)}" style="font-size: 0.85rem; font-weight: 600; line-height: 1.35; margin: 0.2rem 0; cursor: pointer;">${escapeHtml(item.title)}</h5>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.readTime || '3 phút đọc')}</span>
      </div>
      <button class="bookmark-remove" data-id="${escapeAttribute(item.id)}" style="color: var(--text-muted); padding: 0.4rem; border-radius: 4px;" title="Xóa">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  }).join('');

  // Gán bằng "=" (không dùng addEventListener) để mỗi lần render không bị gắn trùng
  listEl.onclick = (event) => {
    const openEl = event.target.closest('.bookmark-open');
    const removeEl = event.target.closest('.bookmark-remove');
    if (openEl) {
      openReaderModalById(openEl.dataset.id);
      closeBookmarksDrawer();
    } else if (removeEl) {
      toggleBookmark({ id: removeEl.dataset.id });
    }
  };
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
    seconds = 0;
    if (timeDisplay) timeDisplay.textContent = '00:00 / 01:00'; 
    container.classList.remove('audio-playing');
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    clearInterval(timerInterval);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

/* ==========================================================================
   6. Reader Modal
   6. Reader Modal (Chế Độ Đọc Bài Báo Chi Tiết & Bình Luận & Dịch Thuật)
   ========================================================================== */
let currentArticleData = null;
let currentOriginalContent = null;
let currentModalLang = 'vi';
let currentFontSize = 17;

const LANG_TTS_MAP = {
  'vi': 'vi-VN',
  'en': 'en-US',
  'fr': 'fr-FR',
  'zh-CN': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR'
};

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
  const translateSelect = document.getElementById('modal-translate-select');

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
  if (translateSelect) {
    translateSelect.addEventListener('change', async (e) => {
      const targetLang = e.target.value;
      await translateModalArticle(targetLang);
    });
  }

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
              ${escapeHtml(author)}
            </span>
            <span style="font-size:.75rem;color:var(--text-muted);">Vừa xong</span>
          </div>
          <p class="comment-text">${escapeHtml(content)}</p>
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
  currentModalLang = 'vi';
  const translateSelect = document.getElementById('modal-translate-select');
  if (translateSelect) translateSelect.value = 'vi';

  // Cập nhật trạng thái nút Lưu Offline
  updateOfflineButtonState(article.id);

  const modal = document.getElementById('reader-modal');
  if (!modal) return;

  // Reset chế độ đọc tập trung khi mở bài viết mới.
  const readerCard = modal.querySelector('.reader-modal-card');
  if (readerCard) readerCard.classList.remove('focus-mode');

  const focusBtn = document.getElementById('focus-mode-btn');
  if (focusBtn) {
    focusBtn.innerHTML = '<i class="fa-solid fa-book-open"></i><span>Chế độ đọc tập trung</span>';
  }
  const defaultContent = article.content || `<p>${article.sapo || ''}</p><p>Nội dung chi tiết đang được các phóng viên tiếp tục cập nhật...</p>`;

  // Lưu trữ bản gốc để có thể hoàn nguyên tức thì khi chuyển về tiếng Việt
  currentOriginalContent = {
    title: article.title || '',
    sapo: article.sapo || '',
    content: defaultContent
  };

  document.getElementById('modal-cat-tag').textContent = article.category || 'Tin Tiêu Điểm';
  document.getElementById('modal-title').textContent = article.title;
  document.getElementById('modal-sapo').textContent = article.sapo || '';
  document.getElementById('modal-author').textContent = article.author?.name || 'Ban Biên Tập VNews';
  document.getElementById('modal-date').textContent = article.publishedAt || 'Hôm nay';
  document.getElementById('modal-read-time').textContent = article.readTime || '4 phút đọc';

  const modalImg = document.getElementById('modal-image');

  if (modalImg && article.image) {
    modalImg.src = imageUrl(article.image);
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
    modalBody.innerHTML = safeHtml(article.content) || `
      <p>${article.sapo}</p>
      <p>Nội dung chi tiết đang được các phóng viên chiến trường tiếp tục cập nhật theo diễn biến mới nhất của sự kiện...</p>
    `;
    modalBody.innerHTML = defaultContent;
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
              ${escapeHtml(c.user)}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(c.time)}</span>
          </div>
          <p class="comment-text">${escapeHtml(c.text)}</p>
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

  if (article.link && !article.content) {
    const modalBody = document.getElementById('modal-body-content');
    if (modalBody) modalBody.innerHTML = '<p>Đang tải toàn văn bài viết...</p>';
    loadFullArticle(article);
  }
}

async function loadFullArticle(article) {
  try {
    const response = await fetch(`/api/article?url=${encodeURIComponent(article.link)}`);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Không thể lấy toàn văn');
    Object.assign(article, result.article);
    if (currentArticleData !== article) return;

    // Cập nhật lại bản gốc sau khi tải được bài đầy đủ
    currentOriginalContent = {
      title: article.title,
      sapo: article.sapo || '',
      content: article.content || '<p>Bài viết chưa có nội dung toàn văn.</p>'
    };

    const modalTitle = document.getElementById('modal-title');
    const modalSapo = document.getElementById('modal-sapo');
    const modalBody = document.getElementById('modal-body-content');
    const modalImg = document.getElementById('modal-image');
    if (modalTitle) modalTitle.textContent = article.title;
    if (modalSapo) modalSapo.textContent = article.sapo || '';
    if (modalBody) modalBody.innerHTML = article.content ? safeHtml(article.content) : '<p>Bài viết chưa có nội dung toàn văn.</p>';
    if (modalImg && article.image) {
      modalImg.src = imageUrl(article.image);
      modalImg.style.display = 'block';
    }
    showToast('Đã tải toàn văn bài viết');
  } catch (error) {
    console.error('Article crawling failed:', error);
    showToast('Không thể tải toàn văn, đang hiển thị phần tóm tắt');
  }
}

async function translateText(text, targetLang) {
  if (!text || !text.trim() || targetLang === 'vi') return text;
  try {
    const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}&to=${encodeURIComponent(targetLang)}&from=vi`);
    const json = await res.json();
    if (json.ok && json.translatedText) return json.translatedText;
  } catch (err) {
    console.warn('Translate error:', err);
  }
  return text;
}

async function translateModalArticle(targetLang) {
  if (!currentOriginalContent) return;
  currentModalLang = targetLang;

  const titleEl = document.getElementById('modal-title');
  const sapoEl = document.getElementById('modal-sapo');
  const bodyEl = document.getElementById('modal-body-content');

  // Khôi phục bản gốc tiếng Việt
  if (targetLang === 'vi') {
    if (titleEl) titleEl.textContent = currentOriginalContent.title;
    if (sapoEl) sapoEl.textContent = currentOriginalContent.sapo;
    if (bodyEl) bodyEl.innerHTML = safeHtml(currentOriginalContent.content);
    showToast('Đã chuyển về bản tin tiếng Việt gốc');
    return;
  }

  showToast('Đang dịch bài viết sang ngôn ngữ mới...');

  try {
    // Dịch tiêu đề
    const translatedTitlePromise = translateText(currentOriginalContent.title, targetLang);

    // Dịch sapo
    const translatedSapoPromise = currentOriginalContent.sapo ? translateText(currentOriginalContent.sapo, targetLang) : Promise.resolve('');

    // Dịch các đoạn văn bản trong phần thân bài
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentOriginalContent.content;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p')).filter(p => p.textContent.trim().length > 0);

    // Giới hạn dịch tối đa 5 đoạn đầu tiên để bảo đảm tốc độ và quota API
    const paragraphsToTranslate = paragraphs.slice(0, 5);
    const translatedParagraphsPromises = paragraphsToTranslate.map(p => translateText(p.textContent.trim(), targetLang));

    const [transTitle, transSapo, ...transParas] = await Promise.all([
      translatedTitlePromise,
      translatedSapoPromise,
      ...translatedParagraphsPromises
    ]);

    // Kiểm tra nếu người dùng chưa đổi ngôn ngữ khác trong khi chờ
    if (currentModalLang !== targetLang) return;

    if (titleEl) titleEl.textContent = transTitle;
    if (sapoEl) sapoEl.textContent = transSapo;

    if (bodyEl && transParas.length > 0) {
      bodyEl.innerHTML = transParas.map(text => `<p>${escapeHtml(text)}</p>`).join('') + 
        `<div class="translation-indicator"><i class="fa-solid fa-circle-check"></i> Bài viết đã được dịch tự động bởi VNEWS AI Translation</div>`;
    }

    showToast('Bản dịch đã sẵn sàng!');
  } catch (error) {
    console.error('Translation failed:', error);
    showToast('Không thể hoàn tất dịch thuật, vui lòng thử lại');
  }
}

function openReaderModalById(id) {
  const mockArticles = [
    NEWS_DATA.mainHero,
    NEWS_DATA.eMagazine,
    ...(NEWS_DATA.subHeroes || []),
    ...(NEWS_DATA.businessNews || [])
  ];

  let article =
    offlineArticles.find(item => item.id === id) ||
    rssArticles.find(item => item.id === id) ||
    bookmarks.find(item => item.id === id) ||
    mockArticles.find(item => item.id === id);

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
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Quick modal TTS trigger với hỗ trợ đa ngôn ngữ
function playModalTTS() {
  if (!('speechSynthesis' in window)) {
    showToast('Trình duyệt không hỗ trợ phát giọng nói');
    return;
  }

  window.speechSynthesis.cancel();

  const title = document.getElementById('modal-title').textContent;
  const sapo = document.getElementById('modal-sapo').textContent;

  const utterance = new SpeechSynthesisUtterance(`${title}. ${sapo}`);
  utterance.lang = LANG_TTS_MAP[currentModalLang] || 'vi-VN';
  utterance.rate = 1.0;

  window.speechSynthesis.speak(utterance);
  showToast(`Đang phát giọng đọc AI (${utterance.lang})...`);
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
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-crimson);"></i> ${escapeHtml(message)}`;

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
const DEFAULT_LOCATION = { lat: 10.8231, lon: 106.6297, city: 'TP.HCM' };

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

  const cityEl = document.getElementById('weather-city');
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const iconEl = document.getElementById('weather-icon');

  if (cityEl) cityEl.textContent = city;
  if (tempEl) tempEl.textContent = Math.round(temp) + '°C';
  if (descEl) descEl.textContent = info.text;
  if (iconEl) iconEl.className = 'fa-solid ' + info.icon;
}


/* ==========================================================================
   TÍNH NĂNG: XUẤT BẢN PDF & LƯU ĐỌC OFFLINE
   ========================================================================== */

function updateOfflineButtonState(articleId) {
  const offlineBtn = document.getElementById('modal-offline-save-btn');
  if (!offlineBtn) return;
  const isSaved = offlineArticles.some(a => a.id === articleId);
  if (isSaved) {
    offlineBtn.classList.add('active');
    offlineBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Đã lưu Offline</span>';
    offlineBtn.title = 'Bài viết đã lưu trong bộ nhớ máy. Bấm để xóa';
  } else {
    offlineBtn.classList.remove('active');
    offlineBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> <span>Lưu Offline</span>';
    offlineBtn.title = 'Lưu toàn bộ nội dung để đọc khi không có mạng internet';
  }
}

function saveArticleOffline() {
  if (!currentArticleData) {
    showToast('Chưa có bài viết được chọn');
    return;
  }

  const articleId = currentArticleData.id;
  const existingIndex = offlineArticles.findIndex(a => a.id === articleId);

  if (existingIndex > -1) {
    offlineArticles.splice(existingIndex, 1);
    localStorage.setItem('vnews-offline-articles', JSON.stringify(offlineArticles));
    updateOfflineButtonState(articleId);
    renderBookmarksList();
    showToast('Đã xóa bài viết khỏi bộ nhớ Offline');
    return;
  }

  // Thu thập nội dung đầy đủ hiện tại
  const title = document.getElementById('modal-title')?.textContent || currentArticleData.title;
  const sapo = document.getElementById('modal-sapo')?.textContent || currentArticleData.sapo;
  const content = document.getElementById('modal-body-content')?.innerHTML || currentArticleData.content;
  const category = document.getElementById('modal-cat-tag')?.textContent || currentArticleData.category;
  const authorName = document.getElementById('modal-author')?.textContent || currentArticleData.author?.name;
  const publishedAt = document.getElementById('modal-date')?.textContent || currentArticleData.publishedAt;
  const readTime = document.getElementById('modal-read-time')?.textContent || currentArticleData.readTime;
  const image = currentArticleData.image || '';

  const offlineItem = {
    id: articleId,
    title,
    sapo,
    content,
    category,
    image,
    publishedAt,
    readTime,
    author: { name: authorName },
    savedOfflineAt: new Date().toISOString()
  };

  offlineArticles.unshift(offlineItem);
  localStorage.setItem('vnews-offline-articles', JSON.stringify(offlineArticles));

  // Tự động bookmark luôn nếu chưa bookmark
  if (!bookmarks.some(b => b.id === articleId)) {
    bookmarks.unshift(offlineItem);
    localStorage.setItem('vnews-bookmarks', JSON.stringify(bookmarks));
    updateBookmarkUI();
  }

  updateOfflineButtonState(articleId);
  renderBookmarksList();
  showToast('Đã lưu bài viết Offline thành công! Bạn có thể đọc bài ngay cả khi mất mạng.');
}

function exportArticleToPDF() {
  if (!currentArticleData) {
    showToast('Không có bài viết nào đang mở');
    return;
  }

  showToast('Đang khởi tạo bản in PDF chuẩn báo chí...');

  // Sử dụng window.print() với CSS @media print đã được tối ưu hóa cho bài báo
  setTimeout(() => {
    window.print();
  }, 250);
}


function initNetworkStatusListener() {
  const pill = document.getElementById('network-offline-pill');

  function updateStatus() {
    if (!navigator.onLine) {
      if (pill) pill.style.display = 'inline-flex';
      showToast('Bạn đang ở chế độ Ngoại Tuyến (Offline). Bạn vẫn có thể đọc các bài báo đã lưu!');
    } else {
      if (pill) pill.style.display = 'none';
    }
  }

  window.addEventListener('online', () => {
    updateStatus();
    showToast('Đã kết nối Internet trở lại!');
  });
  window.addEventListener('offline', updateStatus);

  updateStatus();
}
