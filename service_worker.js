const CACHE_NAME = 'spirit-scanner-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// サービスワーカーのインストール
self.addEventListener('install', event => {
  console.log('👻 Spirit Scanner Service Worker インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 キャッシュオープン完了');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ 全ファイルキャッシュ完了');
        return self.skipWaiting();
      })
  );
});

// サービスワーカーのアクティベート
self.addEventListener('activate', event => {
  console.log('🚀 Spirit Scanner Service Worker アクティベート');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✨ Service Worker アクティベート完了');
      return self.clients.claim();
    })
  );
});

// ネットワークリクエストのインターセプト
self.addEventListener('fetch', event => {
  // AdSense関連のリクエストはキャッシュしない
  if (event.request.url.includes('googlesyndication') || 
      event.request.url.includes('googletagservices')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }

        // ネットワークからフェッチ
        return fetch(event.request).then(response => {
          // 有効なレスポンスかチェック
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'spirit-scan-sync') {
    console.log('🔄 バックグラウンド同期実行');
    // 将来的にログの同期などに使用
  }
});

// プッシュ通知（将来の機能拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'spirit-detection',
      actions: [
        {
          action: 'view',
          title: 'スキャンを開始',
          icon: '/icon-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('👻 異常エネルギー検出！', options)
    );
  }
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});