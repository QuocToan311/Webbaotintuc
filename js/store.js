/* ==========================================================================
   VNEWS 24H - Redux Store (Bookmarks & Offline & Thời tiết & Cài đặt)
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
  FONT_SIZE_DECREASED: 'preferences/fontSizeDecreased'
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
  decreaseFontSize: () => ({ type: ActionTypes.FONT_SIZE_DECREASED })
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
    preferences: preferencesReducer
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

  lastPersistedState = state;
});
