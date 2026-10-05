/* ============================================================
   AiFeng · 资源导航 — Service Worker
   ============================================================ */

var CACHE_NAME = 'afeng-v1';

/* 需要预缓存的静态资源（同目录） */
var PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* 安装：预缓存静态资源 */
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS).catch(function(){
        /* 某个资源缺失时不阻断安装 */
      });
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* 请求拦截 */
self.addEventListener('fetch', function(event){
  var req = event.request;

  /* 只处理 GET */
  if (req.method !== 'GET') return;

  /* 只处理同源请求 */
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;
  var isData = /data\.js$/i.test(path);
  var isHtml = /\/$|index\.html$/i.test(path) || req.mode === 'navigate';
  var isAsset = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(path);

  /* data.js 与 HTML：网络优先（保证拿到最新） */
  if (isData || isHtml){
    event.respondWith(
      fetch(req).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(req, copy).catch(function(){});
        });
        return resp;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          if (cached) return cached;
          if (isHtml) return caches.match('./index.html');
          return new Response('', { status: 504, statusText: '离线' });
        });
      })
    );
    return;
  }

  /* 静态资源：缓存优先 */
  if (isAsset){
    event.respondWith(
      caches.match(req).then(function(cached){
        if (cached) return cached;
        return fetch(req).then(function(resp){
          if (resp && resp.status === 200){
            var copy = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(req, copy).catch(function(){});
            });
          }
          return resp;
        }).catch(function(){
          return new Response('', { status: 504, statusText: '离线' });
        });
      })
    );
    return;
  }
});