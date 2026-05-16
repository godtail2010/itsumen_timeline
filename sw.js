const CACHE_NAME = 'itsumen-timeline-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './top_title.png'
];

// インストール：新しいキャッシュを作成
self.addEventListener('install', event => {
  self.skipWaiting(); // 即座に新しいSWを有効化
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ：ネットワーク優先（Network First）
self.addEventListener('fetch', event => {
  // HTMLファイルなどは常にネットワークを確認
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // それ以外はキャッシュがあればキャッシュ、なければネットワーク
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(netResponse => {
          const copy = netResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return netResponse;
        });
      })
  );
});
