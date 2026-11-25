// Bộ phận chạy nền của ứng dụng: lưu sẵn "vỏ" app để mở nhanh và hiện thông báo khi mất mạng.
// Dữ liệu học tập vẫn lấy trực tiếp từ Google, không lưu trên điện thoại.
const CACHE = 'lopcoha-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // không can thiệp dữ liệu Google
  // Mở app (kể cả từ mã QR điểm danh ?dd=...): luôn lưu chung 1 bản trang chính, không lưu theo từng mã
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Ưu tiên mạng để luôn có bản mới; mất mạng thì dùng bản đã lưu
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
