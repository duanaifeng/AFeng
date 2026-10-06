/* ============================================================
   AiFeng · 资源导航 — Service Worker（纯在线，永远最新）
   ============================================================ */

/* 安装：立即跳过等待 */
self.addEventListener('install', function(){
  self.skipWaiting();
});

/* 激活：清掉所有旧缓存 + 立即接管所有页面 */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* 接收页面消息：跳过等待 */
self.addEventListener('message', function(event){
  if (event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

/* 请求拦截：全部走网络，不做任何缓存 */
self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).catch(function(){
      return new Response('', { status: 504, statusText: '离线' });
    })
  );
});