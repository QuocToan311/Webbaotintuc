const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 15000;

const SOURCES = {
  vnexpress: {
    name: 'VnExpress',
    categories: {
      home: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
      thoisu: 'https://vnexpress.net/rss/thoi-su.rss',
      kinhdoanh: 'https://vnexpress.net/rss/kinh-doanh.rss',
      congnghe: 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss',
      thethao: 'https://vnexpress.net/rss/the-thao.rss',
      giaitri: 'https://vnexpress.net/rss/giai-tri.rss',
      doisong: 'https://vnexpress.net/rss/gia-dinh.rss'
    }
  },
  tuoitre: {
    name: 'Tuổi Trẻ',
    categories: {
      home: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
      thoisu: 'https://tuoitre.vn/rss/thoi-su.rss',
      kinhdoanh: 'https://tuoitre.vn/rss/kinh-doanh.rss',
      congnghe: 'https://tuoitre.vn/rss/nhip-song-so.rss',
      thethao: 'https://tuoitre.vn/rss/the-thao.rss',
      giaitri: 'https://tuoitre.vn/rss/giai-tri.rss',
      doisong: 'https://tuoitre.vn/rss/van-hoa.rss'
    }
  },
  thanhnien: {
    name: 'Thanh Niên',
    categories: {
      home: 'https://thanhnien.vn/rss/home.rss',
      thoisu: 'https://thanhnien.vn/rss/thoi-su.rss',
      kinhdoanh: 'https://thanhnien.vn/rss/kinh-te.rss',
      congnghe: 'https://thanhnien.vn/rss/cong-nghe.rss',
      thethao: 'https://thanhnien.vn/rss/the-thao.rss',
      giaitri: 'https://thanhnien.vn/rss/giai-tri.rss',
      doisong: 'https://thanhnien.vn/rss/doi-song.rss'
    }
  },
  dantri: {
    name: 'Dân Trí',
    categories: {
      home: 'https://dantri.com.vn/rss/home.rss',
      thoisu: 'https://dantri.com.vn/rss/xa-hoi.rss',
      kinhdoanh: 'https://dantri.com.vn/rss/kinh-doanh.rss',
      congnghe: 'https://dantri.com.vn/rss/suc-manh-so.rss',
      thethao: 'https://dantri.com.vn/rss/the-thao.rss',
      giaitri: 'https://dantri.com.vn/rss/giai-tri.rss',
      doisong: 'https://dantri.com.vn/rss/doi-song.rss'
    }
  }
};

const cache = new Map();
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function decodeXml(value = '') {
  let decoded = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  for (let pass = 0; pass < 3; pass += 1) {
    decoded = decoded
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  return decoded;
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function getImage(block, description) {
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  const media = block.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  const htmlImage = (description || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return decodeXml((enclosure && enclosure[1]) || (media && media[1]) || (htmlImage && htmlImage[1]) || '');
}

function stripTags(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRss(xml, sourceName) {
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  return items.map((match, index) => {
    const block = match[1];
    const description = getTag(block, 'description');
    const link = getTag(block, 'link') || (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '';
    const title = stripTags(getTag(block, 'title'));
    const publishedAt = getTag(block, 'pubDate') || getTag(block, 'dc:date');
    return {
      id: `${sourceName.toLowerCase().replace(/\W/g, '')}-${index}-${Buffer.from(link).toString('base64url').slice(0, 12)}`,
      source: sourceName,
      title,
      link: decodeXml(link.trim()),
      sapo: stripTags(description).slice(0, 320),
      description,
      image: getImage(block, description),
      publishedAt,
      category: sourceName
    };
  }).filter(item => item.title && item.link);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VNEWS24H/1.0 RSS reader' }
    });
    if (!response.ok) throw new Error(`Nguồn trả về HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getRss(source, category, forceRefresh = false) {
  const sourceConfig = SOURCES[source];
  if (!sourceConfig) throw new Error(`Nguồn RSS không hợp lệ: ${source}`);
  const feedUrl = sourceConfig.categories[category] || sourceConfig.categories.home;
  const key = `${source}:${category}`;
  const cached = cache.get(key);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.data;
  const data = parseRss(await fetchText(feedUrl), sourceConfig.name);
  if (!data.length) throw new Error('RSS không có bài viết hợp lệ');
  const result = { source, category, fetchedAt: new Date().toISOString(), items: data };
  cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

function sanitizeArticleHtml(html, baseUrl) {
  const base = new URL(baseUrl);
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(['"])(.*?)\1/gi, (match, quote, value) => {
      try {
        const absolute = new URL(value, base).href;
        return ` ${match.trim().split('=')[0]}=${quote}${absolute}${quote}`;
      } catch {
        return '';
      }
    })
    .replace(/<(?!\/?(?:p|br|strong|em|b|i|h2|h3|blockquote|figure|figcaption|img)\b)[^>]+>/gi, '');
}

function extractArticle(html, articleUrl) {
  const title = stripTags((html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || [])[1])
    || stripTags(getTag(html, 'title'));
  const image = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) || [])[1] || '';
  const description = (html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i) || [])[1] || '';
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const body = articleMatch ? articleMatch[1] : html;
  const paragraphs = [...body.matchAll(/<(?:p|h2|h3|blockquote|figure)\b[^>]*>[\s\S]*?<\/(?:p|h2|h3|blockquote|figure)>/gi)]
    .map(match => match[0]).join('');
  const content = sanitizeArticleHtml(paragraphs || body.slice(0, 100000), articleUrl);
  return {
    title: title || 'Bài viết RSS',
    sapo: stripTags(description),
    image: image ? new URL(image, articleUrl).href : '',
    content,
    link: articleUrl,
    publishedAt: new Date().toLocaleString('vi-VN'),
    author: { name: 'Nguồn RSS' }
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/sources') {
    return sendJson(res, 200, Object.entries(SOURCES).map(([id, value]) => ({
      id, name: value.name, categories: Object.keys(value.categories)
    })));
  }
  if (url.pathname === '/api/rss') {
    try {
      const data = await getRss(url.searchParams.get('source') || 'vnexpress', url.searchParams.get('category') || 'home', url.searchParams.get('refresh') === '1');
      return sendJson(res, 200, { ok: true, ...data });
    } catch (error) {
      return sendJson(res, 502, { ok: false, error: error.message });
    }
  }
  if (url.pathname === '/api/article') {
    const articleUrl = url.searchParams.get('url');
    if (!articleUrl) return sendJson(res, 400, { ok: false, error: 'Thiếu URL bài viết' });
    try {
      const parsed = new URL(articleUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL không được hỗ trợ');
      return sendJson(res, 200, { ok: true, article: extractArticle(await fetchText(parsed.href), parsed.href) });
    } catch (error) {
      return sendJson(res, 502, { ok: false, error: `Không thể crawl bài viết: ${error.message}` });
    }
  }
  if (url.pathname === '/api/translate') {
    const text = url.searchParams.get('text') || '';
    const targetLang = (url.searchParams.get('to') || 'en').toLowerCase();
    const sourceLang = (url.searchParams.get('from') || 'vi').toLowerCase();

    if (!text.trim()) {
      return sendJson(res, 400, { ok: false, error: 'Thiếu nội dung cần dịch' });
    }

    const cacheKey = 'translate:' + sourceLang + ':' + targetLang + ':' + text.slice(0, 100) + ':' + text.length;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return sendJson(res, 200, { ok: true, translatedText: cached.data, from: sourceLang, to: targetLang, cached: true });
    }

    try {
      // Chunking if text is long
      const textToTranslate = text.slice(0, 2500);
      const myMemoryUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(textToTranslate) + '&langpair=' + sourceLang + '|' + targetLang;
      const response = await fetch(myMemoryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!response.ok) throw new Error('Dịch vụ dịch thuật trả về HTTP ' + response.status);
      const data = await response.json();
      const translatedText = data.responseData?.translatedText || text;

      cache.set(cacheKey, { data: translatedText, expiresAt: Date.now() + 60 * 60 * 1000 });
      return sendJson(res, 200, { ok: true, translatedText, from: sourceLang, to: targetLang });
    } catch (error) {
      return sendJson(res, 502, { ok: false, error: 'Không thể dịch: ' + error.message });
    }
  }

  if (url.pathname === '/api/image') {
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) return sendJson(res, 400, { ok: false, error: 'Thiếu URL ảnh' });
    try {
      const parsed = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.endsWith('vnecdn.net')) {
        return sendJson(res, 400, { ok: false, error: 'Chỉ hỗ trợ ảnh từ CDN VnExpress' });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      try {
        const response = await fetch(parsed.href, {
          signal: controller.signal,
          headers: {
            Referer: 'https://vnexpress.net/',
            'User-Agent': 'Mozilla/5.0 (compatible; VNEWS24H/1.0)'
          }
        });
        if (!response.ok) throw new Error(`CDN trả về HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300'
        });
        res.end(Buffer.from(await response.arrayBuffer()));
      } finally {
        clearTimeout(timer);
      }
      return;
    } catch (error) {
      return sendJson(res, 502, { ok: false, error: `Không thể tải ảnh: ${error.message}` });
    }
  }
  return sendJson(res, 404, { ok: false, error: 'API không tồn tại' });
}

function serveStatic(req, res, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400); res.end('Bad Request'); return;
  }
  if (pathname === '/') pathname = '/index.html';
  const root = path.resolve(__dirname);
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch(error => sendJson(res, 500, { ok: false, error: error.message }));
    return;
  }
  serveStatic(req, res, url);
});

setInterval(() => {
  for (const [key, value] of cache) if (value.expiresAt <= Date.now()) cache.delete(key);
}, 10 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`VNEWS server is running at http://localhost:${PORT}`);
});
