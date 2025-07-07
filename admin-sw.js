// กำหนดชื่อแคชสำหรับ Service Worker
const CACHE_NAME = 'checklog-admin-cache-v1';

// รายการไฟล์ที่ต้องการแคชล่วงหน้าเมื่อ Service Worker ถูกติดตั้ง
const urlsToCache = [
    '/', // แคชหน้าหลัก
    '/index.html', // หน้า HTML หลัก
    '/admin-manifest.json', // ไฟล์ Manifest ของ PWA
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap', // Google Fonts CSS
    'https://fonts.gstatic.com', // Google Fonts static content
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', // Library สำหรับ Excel
    'https://raw.githubusercontent.com/mm12346/test1/refs/heads/main/192.png', // ไอคอน 192x192
    'https://raw.githubusercontent.com/mm12346/test1/refs/heads/main/512.png', // ไอคอน 512x512
    'https://raw.githubusercontent.com/mm12346/test1/refs/heads/main/180.png', // ไอคอน Apple Touch
    'https://raw.githubusercontent.com/mm12346/test1/refs/heads/main/512.png' // ไอคอนเว็บไซต์
];

// เหตุการณ์ 'install': ติดตั้ง Service Worker และแคชไฟล์ที่จำเป็น
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache); // เพิ่มไฟล์ทั้งหมดลงในแคช
            })
            .catch((error) => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// เหตุการณ์ 'fetch': ดักจับคำขอเครือข่ายและให้บริการจากแคชหรือเครือข่าย
self.addEventListener('fetch', (event) => {
    // ตรวจสอบว่าคำขอเป็นของ Google Apps Script API หรือไม่
    const isGoogleScriptApi = event.request.url.includes('script.google.com/macros/s/');

    // สำหรับคำขอ Google Apps Script API เราจะไม่แคช แต่จะส่งตรงไปยังเครือข่าย
    if (isGoogleScriptApi) {
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.error('API fetch failed:', error);
                // สามารถเพิ่มการจัดการข้อผิดพลาดสำหรับ API ได้ที่นี่
                // เช่น ส่งคืน Response ที่มีข้อความแสดงข้อผิดพลาด
                return new Response('API request failed', { status: 503, statusText: 'Service Unavailable' });
            })
        );
        return; // ออกจากฟังก์ชันเพื่อไม่ให้ Service Worker จัดการคำขอนี้ต่อ
    }

    // สำหรับคำขออื่นๆ ให้ใช้กลยุทธ์ Cache-First with Network Fallback
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // ถ้าพบในแคช ให้ส่งคืนจากแคช
                if (response) {
                    return response;
                }
                // ถ้าไม่พบในแคช ให้ไปดึงจากเครือข่าย
                return fetch(event.request)
                    .then((networkResponse) => {
                        // ตรวจสอบว่า Response ถูกต้องหรือไม่ก่อนที่จะเพิ่มลงในแคช
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // คัดลอก Response เพื่อให้สามารถใช้ได้ทั้งกับเบราว์เซอร์และแคช
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache); // เพิ่ม Response ลงในแคช
                            });
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Fetch failed; returning offline page or error:', error);
                        // สามารถส่งคืนหน้าออฟไลน์ที่กำหนดเองได้ที่นี่
                        // ตัวอย่าง: return caches.match('/offline.html');
                        return new Response('Offline', { status: 503, statusText: 'Offline' });
                    });
            })
    );
});

// เหตุการณ์ 'activate': จัดการการอัปเดต Service Worker และล้างแคชเก่า
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // ลบแคชเก่าที่ไม่ตรงกับ CACHE_NAME ปัจจุบัน
                    }
                })
            );
        })
    );
});
