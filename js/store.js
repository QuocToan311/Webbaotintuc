/* ==========================================================================
   VNEWS 24H - Redux Store (Bookmarks & Offline & Thời tiết & Cài đặt & RSS & Tìm kiếm)
   ========================================================================== */

// ---- Action types ----
const ActionTypes = {
  BOOKMARK_TOGGLED: 'bookmarks/toggled',
  BOOKMARK_ADDED: 'bookmarks/added',
  OFFLINE_SAVED: 'offline/saved',
  OFFLINE_REMOVED: 'offline/removed',
  WEATHER_REQUESTED: 'weather/requested',
  WEATHER_RECEIVED: 'weather/received',
  WEATHER_FAILED: 'weather/failed',
  THEME_SET: 'preferences/themeSet',
  FONT_SIZE_INCREASED: 'preferences/fontSizeIncreased',
  FONT_SIZE_DECREASED: 'preferences/fontSizeDecreased',
  RSS_SOURCE_CHANGED: 'rss/sourceChanged',
  RSS_CATEGORY_CHANGED: 'rss/categoryChanged',
  RSS_REQUESTED: 'rss/requested',
  RSS_RECEIVED: 'rss/received',
  RSS_FAILED: 'rss/failed',
  RSS_LOAD_MORE: 'rss/loadMore',
  SEARCH_QUERY_CHANGED: 'search/queryChanged',
  SEARCH_ACTIVE_MOVED: 'search/activeMoved',
  SEARCH_CLEARED: 'search/cleared'
};

// ---- Action creators ----
const actions = {
  toggleBookmark: article => ({ type: ActionTypes.BOOKMARK_TOGGLED, payload: article }),
  addBookmark: article => ({ type: ActionTypes.BOOKMARK_ADDED, payload: article }),
  saveOffline: article => ({ type: ActionTypes.OFFLINE_SAVED, payload: article }),
  removeOffline: id => ({ type: ActionTypes.OFFLINE_REMOVED, payload: id }),
  //bắt đầu gọi API thời tiết
  requestWeather: city => ({ type: ActionTypes.WEATHER_REQUESTED, payload: city }),
  //gọi API thành công, payload = { city, temp, code }
  receiveWeather: weather => ({ type: ActionTypes.WEATHER_RECEIVED, payload: weather }),
  //gọi API lỗi, payload = nội dung lỗi
  failWeather: message => ({ type: ActionTypes.WEATHER_FAILED, payload: message }),
  //người dùng bấm nút đổi theme, payload = 'light' | 'dark'
  setTheme: theme => ({ type: ActionTypes.THEME_SET, payload: theme }),
  //nút A+ / A- trong cửa sổ đọc bài
  increaseFontSize: () => ({ type: ActionTypes.FONT_SIZE_INCREASED }),
  decreaseFontSize: () => ({ type: ActionTypes.FONT_SIZE_DECREASED }),
  //chọn nguồn báo trong dropdown, payload = 'vnexpress' | 'tuoitre' | 'thanhnien' | 'dantri'
  changeRssSource: source => ({ type: ActionTypes.RSS_SOURCE_CHANGED, payload: source }),
  //bấm menu chuyên mục, payload = 'home' | 'thoisu' | ...
  changeRssCategory: category => ({ type: ActionTypes.RSS_CATEGORY_CHANGED, payload: category }),
  //bắt đầu gọi /api/rss
  requestRss: () => ({ type: ActionTypes.RSS_REQUESTED }),
  //tải xong, payload = { items, keepVisibleCount } (keepVisibleCount = true khi tự làm mới 5 phút)
  receiveRss: (items, keepVisibleCount) => ({ type: ActionTypes.RSS_RECEIVED, payload: { items, keepVisibleCount } }),
  //tải lỗi, payload = { message, fallbackItems } (fallbackItems = dữ liệu mẫu dùng khi chưa có tin)
  failRss: (message, fallbackItems) => ({ type: ActionTypes.RSS_FAILED, payload: { message, fallbackItems } }),
  //bấm nút 'Xem thêm tin tức'
  loadMoreRss: () => ({ type: ActionTypes.RSS_LOAD_MORE }),
  //gõ vào ô tìm kiếm, payload = chữ trong ô
  changeSearchQuery: query => ({ type: ActionTypes.SEARCH_QUERY_CHANGED, payload: query }),
  //bấm phím lên / xuống, payload = { step: 1 | -1, total: số kết quả đang hiện }
  moveSearchActive: (step, total) => ({ type: ActionTypes.SEARCH_ACTIVE_MOVED, payload: { step, total } }),
  //bấm Esc hoặc đã mở bài => xóa ô tìm kiếm
  clearSearch: () => ({ type: ActionTypes.SEARCH_CLEARED })
};

// ---- Đọc/ghi localStorage an toàn ----
function loadList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.warn('[store] Không ghi được localStorage:', error);
    if (typeof showToast === 'function') showToast('Bộ nhớ trình duyệt đã đầy, không thể lưu thêm');
  }
}

//đọc theme đã lưu, chưa bấm nút lần nào => null (theo cài đặt sáng/tối của máy)
function loadTheme() {
  try {
    const value = localStorage.getItem('vnews-theme');
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

//giới hạn cỡ chữ giữ đúng như code cũ: tăng khi < 24, giảm khi > 13, mỗi lần 2px
const FONT_SIZE_DEFAULT = 17;
const FONT_SIZE_MIN = 13;
const FONT_SIZE_MAX = 25;

//đọc cỡ chữ đã lưu, sai hoặc chưa có => 17px
function loadFontSize() {
  try {
    const value = Number(localStorage.getItem('vnews-font-size'));
    return value >= FONT_SIZE_MIN && value <= FONT_SIZE_MAX ? value : FONT_SIZE_DEFAULT;
  } catch {
    return FONT_SIZE_DEFAULT;
  }
}

//nguồn báo hợp lệ (trùng với value trong dropdown ở index.html)
const RSS_SOURCES = ['vnexpress', 'tuoitre', 'thanhnien', 'dantri'];

//đọc nguồn báo đã lưu, chưa có hoặc sai => VnExpress
function loadRssSource() {
  try {
    const value = localStorage.getItem('vnews-rss-source');
    return RSS_SOURCES.includes(value) ? value : 'vnexpress';
  } catch {
    return 'vnexpress';
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.warn('[store] Không ghi được localStorage:', error);
  }
}

// ---- Reducers (hàm thuần: không sửa state cũ, không gọi DOM/localStorage) ----
function bookmarksReducer(state = loadList('vnews-bookmarks'), action) {
  switch (action.type) {
    case ActionTypes.BOOKMARK_TOGGLED:
      return state.some(item => item.id === action.payload.id)
        ? state.filter(item => item.id !== action.payload.id)
        : [action.payload, ...state];
    case ActionTypes.BOOKMARK_ADDED:
      return state.some(item => item.id === action.payload.id)
        ? state
        : [action.payload, ...state];
    default:
      return state;
  }
}

function offlineReducer(state = loadList('vnews-offline-articles'), action) {
  switch (action.type) {
    case ActionTypes.OFFLINE_SAVED:
      return [action.payload, ...state.filter(item => item.id !== action.payload.id)];
    case ActionTypes.OFFLINE_REMOVED:
      return state.filter(item => item.id !== action.payload);
    default:
      return state;
  }
}

//trạng thái ban đầu của thời tiết (chưa gọi API)
const initialWeatherState = {
  status: 'idle', //idle | loading | success | error
  city: '',
  temp: null,
  code: null,
  error: null
};

function weatherReducer(state = initialWeatherState, action) {
  switch (action.type) {
    case ActionTypes.WEATHER_REQUESTED:
      //đang tải => ghi tên vị trí, xóa lỗi cũ
      return { ...state, status: 'loading', city: action.payload, error: null };
    case ActionTypes.WEATHER_RECEIVED:
      //tải xong => lưu nhiệt độ và mã thời tiết
      return {
        ...state,
        status: 'success',
        city: action.payload.city,
        temp: action.payload.temp,
        code: action.payload.code,
        error: null
      };
    case ActionTypes.WEATHER_FAILED:
      //lỗi => giữ dữ liệu cũ (nếu có), chỉ lưu lỗi
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

//cài đặt người dùng: theme = null nghĩa là chưa chọn, đang theo máy
const initialPreferencesState = {
  theme: loadTheme(),
  fontSize: loadFontSize()
};

function preferencesReducer(state = initialPreferencesState, action) {
  switch (action.type) {
    case ActionTypes.THEME_SET:
      return { ...state, theme: action.payload };
    case ActionTypes.FONT_SIZE_INCREASED:
      //chưa tới giới hạn trên => tăng 2px, tới rồi => giữ nguyên
      return state.fontSize < 24 ? { ...state, fontSize: state.fontSize + 2 } : state;
    case ActionTypes.FONT_SIZE_DECREASED:
      //chưa tới giới hạn dưới => giảm 2px, tới rồi => giữ nguyên
      return state.fontSize > 13 ? { ...state, fontSize: state.fontSize - 2 } : state;
    default:
      return state;
  }
}

//số tin hiện lúc đầu và số tin hiện thêm mỗi lần bấm 'Xem thêm' (theo PR #7: đầu 6, thêm 9)
const RSS_INITIAL_COUNT = 6;
const RSS_LOAD_MORE_STEP = 9;

//luồng tin RSS: chỉ nhớ nguồn báo, chuyên mục luôn về Trang chủ khi F5
const initialRssState = {
  source: loadRssSource(),
  category: 'home',
  items: [],
  itemsKey: '',  //tin đang hiện thuộc nguồn + chuyên mục nào, vd 'vnexpress:home'
  visibleCount: RSS_INITIAL_COUNT,
  status: 'idle', //idle | loading | success | error
  error: null,
  isFallback: false //true = đang hiện dữ liệu mẫu
};

function rssReducer(state = initialRssState, action) {
  switch (action.type) {
    case ActionTypes.RSS_SOURCE_CHANGED:
      return { ...state, source: action.payload };
    case ActionTypes.RSS_CATEGORY_CHANGED:
      return { ...state, category: action.payload };
    case ActionTypes.RSS_REQUESTED:
      return { ...state, status: 'loading', error: null };
    case ActionTypes.RSS_RECEIVED:
      return {
        ...state,
        items: action.payload.items,
        itemsKey: state.source + ':' + state.category,
        //tự làm mới 5 phút => giữ số tin đã 'Xem thêm', còn lại => về 6 tin
        visibleCount: action.payload.keepVisibleCount ? state.visibleCount : RSS_INITIAL_COUNT,
        status: 'success',
        error: null,
        isFallback: false
      };
    case ActionTypes.RSS_FAILED: {
      //đang có tin thật của đúng nguồn + chuyên mục này => giữ nguyên tin cũ, chỉ lưu lỗi
      const hasOldItems = state.items.length > 0 && !state.isFallback &&
        state.itemsKey === state.source + ':' + state.category;
      if (hasOldItems) return { ...state, status: 'error', error: action.payload.message };

      //chưa có tin (hoặc tin cũ là của nguồn / chuyên mục khác) => dùng dữ liệu mẫu
      return {
        ...state,
        items: action.payload.fallbackItems,
        itemsKey: '',
        visibleCount: RSS_INITIAL_COUNT,
        status: 'error',
        error: action.payload.message,
        isFallback: true
      };
    }
    case ActionTypes.RSS_LOAD_MORE:
      return { ...state, visibleCount: state.visibleCount + RSS_LOAD_MORE_STEP };
    default:
      return state;
  }
}

//tìm kiếm: chỉ là trạng thái tạm, không lưu localStorage
const initialSearchState = {
  query: '',
  activeIndex: -1 //vị trí đang chọn bằng phím lên / xuống, -1 = chưa chọn
};

function searchReducer(state = initialSearchState, action) {
  switch (action.type) {
    case ActionTypes.SEARCH_QUERY_CHANGED:
      //đổi từ khóa => bỏ vị trí đang chọn cũ
      return { query: action.payload, activeIndex: -1 };
    case ActionTypes.SEARCH_ACTIVE_MOVED: {
      const { step, total } = action.payload;
      if (!total) return state;
      //đi quá cuối thì quay về đầu và ngược lại
      return { ...state, activeIndex: (state.activeIndex + step + total) % total };
    }
    case ActionTypes.SEARCH_CLEARED:
      return initialSearchState;
    default:
      return state;
  }
}

//bỏ dấu tiếng Việt + viết thường, vd 'Bóng Đá' => 'bong da'
//giữ nguyên độ dài chuỗi (mỗi ký tự => đúng 1 ký tự) để tô đậm đúng vị trí trong tiêu đề gốc
//NFC trước để chữ có dấu gõ kiểu tổ hợp (e + dấu) gộp lại thành 1 ký tự
function normalizeSearchText(text = '') {
  return Array.from(String(text).normalize('NFC'), char => {
    const plain = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
    //viết thường từng ký tự rồi lấy 1 ký tự đầu để độ dài không bị lệch
    return (plain || char).replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().charAt(0);
  }).join('');
}

//từ khóa ngắn hơn 2 ký tự thì chưa tìm, tối đa 8 gợi ý
const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_RESULTS = 8;

//tách từ khóa thành từng từ đã bỏ dấu, vd 'Giá  vàng' => ['gia', 'vang']
function getSearchWords(query) {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

function selectSearchResults(state) {
  const words = getSearchWords(state.search.query);
  if (words.join(' ').length < SEARCH_MIN_LENGTH) return { words, items: [], total: 0 };

  //gom tin RSS (cả tin chưa bấm 'Xem thêm') + bài đã lưu, bỏ bài trùng id
  //RSS lỗi và đang hiện dữ liệu mẫu => rss.items chính là dữ liệu mẫu
  const seen = new Set();
  const pool = [...state.rss.items, ...state.offline, ...state.bookmarks].filter(item => {
    if (!item || !item.id || !item.title || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  //bài phải chứa đủ mọi từ trong tiêu đề hoặc sapo, khớp tiêu đề thì xếp lên trước
  const matched = [];
  pool.forEach(item => {
    const title = normalizeSearchText(item.title);
    const text = title + ' ' + normalizeSearchText(item.sapo || item.description || '');
    if (!words.every(word => text.includes(word))) return;
    const inTitle = words.every(word => title.includes(word));
    matched.push({ item, inTitle });
  });
  matched.sort((a, b) => Number(b.inTitle) - Number(a.inTitle));

  return {
    words,
    items: matched.slice(0, SEARCH_MAX_RESULTS).map(entry => entry.item),
    total: matched.length
  };
}

// ---- Selectors ----
const selectors = {
  isBookmarked: (state, id) => state.bookmarks.some(item => item.id === id),
  isOffline: (state, id) => state.offline.some(item => item.id === id)
};

// ---- Tạo store (tự kết nối Redux DevTools nếu có cài extension) ----
const store = Redux.createStore(
  Redux.combineReducers({
    bookmarks: bookmarksReducer,
    offline: offlineReducer,
    weather: weatherReducer,
    preferences: preferencesReducer,
    rss: rssReducer,
    search: searchReducer
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

// ---- Tự lưu localStorage khi phần state tương ứng thay đổi ----
let lastPersistedState = store.getState();
store.subscribe(() => {
  const state = store.getState();
  if (state.bookmarks !== lastPersistedState.bookmarks) saveList('vnews-bookmarks', state.bookmarks);
  if (state.offline !== lastPersistedState.offline) saveList('vnews-offline-articles', state.offline);

  const prefs = state.preferences;
  const lastPrefs = lastPersistedState.preferences;
  //theme chỉ được lưu sau khi người dùng bấm nút (theme khác null)
  if (prefs.theme !== lastPrefs.theme && prefs.theme) saveValue('vnews-theme', prefs.theme);
  if (prefs.fontSize !== lastPrefs.fontSize) saveValue('vnews-font-size', prefs.fontSize);

  //chỉ lưu nguồn báo, không lưu chuyên mục và danh sách tin
  if (state.rss.source !== lastPersistedState.rss.source) saveValue('vnews-rss-source', state.rss.source);

  lastPersistedState = state;
});
