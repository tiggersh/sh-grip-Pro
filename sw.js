// ─────────────────────────────────────────
//  sw.js — SH Grip Pro Service Worker
// ─────────────────────────────────────────

const APP_VERSION = 'v1.0.0';
const CACHE_NAME  = `sh-grip-pro-${APP_VERSION}`;

// GitHub Pages 서브경로 자동 감지
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const STATIC_ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/main.css',
  BASE + '/js/app.js',
  BASE + '/js/db.js',
  BASE + '/js/engine.js',
  BASE + '/js/session.js',
  BASE + '/js/history.js',
  BASE + '/js/stats.js',
  BASE + '/js/settings.js',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

// ── 설치 ─────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── 활성화 (구버전 캐시 삭제) ────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── 패치 (캐시 우선, 네트워크 폴백) ──────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(e.request, { cache: 'no-cache' })
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            return response;
          })
          .catch(() => {
            if (e.request.headers.get('accept')?.includes('text/html')) {
              return caches.match(BASE + '/index.html');
            }
          });
      })
  );
});

// ── 앱에서 업데이트 메시지 수신 ──────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
