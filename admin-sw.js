// ชื่อของ Cache Storage ที่จะใช้เก็บไฟล์สำหรับหน้าแอดมิน
const CACHE_NAME = 'admin-checker-cache-v14';

// รายการไฟล์ที่ต้องการให้ถูกแคชไว้
const urlsToCache = [
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap'
];

// Event: install - ติดตั้ง Service Worker และแคชไฟล์
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Admin Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event: fetch - จัดการ request โดยตอบกลับจาก cache ก่อน
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Event: activate - ลบ cache เก่าที่ไม่จำเป็น
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
