/**
 * Service Worker - Sahabat Mahasiswa PWA
 * Mendukung caching aset statis untuk performa cepat dan kemampuan offline
 */

const CACHE_NAME = 'sahabat-mahasiswa-v1';

// Daftar aset inti yang di-cache saat instalasi PWA
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'login.html',
  'pengaturan.html',
  'manifest.json',
  'supabase-client.js',
  'assets/logo.svg',
  'assets/logo-icon.svg'
];

// 1. Event Install: Cache aset statis aplikasi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Memasang cache aset statis');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Event Activate: Bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Event Fetch: Stale-While-Revalidate / Cache-First dengan Network Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya proses permintaan GET dengan protokol http/https
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // Permintaan API Supabase atau layanan eksternal dialirkan langsung ke jaringan
  if (req.url.includes('supabase.co') || req.url.includes('google') || req.url.includes('unsplash.com')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Aset statis lokal: Ambil dari cache dulu, jika tidak ada ambil dari jaringan
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Ambil update di latar belakang (stale-while-revalidate)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Offline fallback silent */});

        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback jika offline dan membuka halaman HTML
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('index.html');
        }
      });
    })
  );
});
