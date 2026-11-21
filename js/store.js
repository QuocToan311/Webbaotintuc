/* ==========================================================================
   VNEWS 24H - Redux Store (Bookmarks & Offline & Thời tiết)
   ========================================================================== */

// ---- Action types ----
const ActionTypes = {
  BOOKMARK_TOGGLED: 'bookmarks/toggled',
  BOOKMARK_ADDED: 'bookmarks/added',
  OFFLINE_SAVED: 'offline/saved',
  OFFLINE_REMOVED: 'offline/removed',
  WEATHER_REQUESTED: 'weather/requested',
  WEATHER_RECEIVED: 'weather/received',
  WEATHER_FAILED: 'weather/failed'
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
  failWeather: message => ({ type: ActionTypes.WEATHER_FAILED, payload: message })
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
    weather: weatherReducer
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

// ---- Tự lưu localStorage khi phần state tương ứng thay đổi ----
let lastPersistedState = store.getState();
store.subscribe(() => {
  const state = store.getState();
  if (state.bookmarks !== lastPersistedState.bookmarks) saveList('vnews-bookmarks', state.bookmarks);
  if (state.offline !== lastPersistedState.offline) saveList('vnews-offline-articles', state.offline);
  lastPersistedState = state;
});
