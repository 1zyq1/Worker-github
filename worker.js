/**
 * GitHub Accelerator - Cloudflare Worker
 * ✔ 修复 releases/download 404
 * ✔ raw / archive 缓存
 * ✔ release 下载完全直通
 */

const UPSTREAM_HOST = 'https://github.com';
const RAW_HOST = 'https://raw.githubusercontent.com';

// 缓存配置（仅用于 raw / archive）
const CACHE_CONFIG = {
  browserTTL: 60 * 60 * 24 * 7, // 7 天
  edgeTTL: 60 * 60 * 24 * 30,  // 30 天
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

/* ================= HTML 页面 ================= */

function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>GitHub 加速下载</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:url('https://t.alcy.cc/ycy') center/cover fixed;font-family:sans-serif}
body::before{content:'';position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(5px)}
.box{position:relative;z-index:1;background:#fff;padding:32px;border-radius:14px;width:90%;max-width:560px}
input,button{width:100%;padding:12px;font-size:16px;margin-top:10px}
button{background:#667eea;color:#fff;border:none;border-radius:8px;cursor:pointer}
</style>
</head>
<body>
<div class="box">
<h2>GitHub 加速下载</h2>
<input id="url" placeholder="https://github.com/user/repo/archive/refs/heads/main.zip" />
<button onclick="go()">加速下载</button>
</div>
<script>
function go(){
 const v=document.getElementById('url').value.trim();
 if(!v)return alert('请输入链接');
 const u=new URL(v);
 const base=location.origin;
 if(u.hostname==='raw.githubusercontent.com'){
   location.href=base+'/raw'+u.pathname;
 }else{
   location.href=base+u.pathname;
 }
}
</script>
</body>
</html>`;
}

/* ================= 核心逻辑 ================= */

async function handleRequest(event) {
  const request = event.request;
  const url = new URL(request.url);
  const path = url.pathname;

  // 首页
  if (path === '/' || path === '') {
    return new Response(getHTML(), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }

  /* ===== 路径类型判断 ===== */
  const isRaw = path.startsWith('/raw/');
  const isReleaseAsset = path.includes('/releases/download/');
  const isArchive =
    path.startsWith('/archive/') ||
    path.endsWith('.zip') ||
    path.endsWith('.tar.gz');

  /* ===== 上游 URL ===== */
  let upstreamUrl;
  if (isRaw) {
    upstreamUrl = RAW_HOST + path.replace('/raw', '');
  } else {
    upstreamUrl = UPSTREAM_HOST + path;
  }

  /* =================================================
     🔥 关键修复：Release 下载文件【完全直通】
     ================================================= */
  if (isReleaseAsset) {
    return fetch(upstreamUrl, {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
    });
  }

  /* ================== 可缓存资源 ================== */

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);

  let response = await cache.match(cacheKey);
  if (response) return response;

  response = await fetch(upstreamUrl, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  });

  if (!response.ok) {
    return new Response(`Upstream error: ${response.status}`, {
      status: response.status,
    });
  }

  // 只 clone 非下载流
  const newResp = new Response(response.body, response);
  newResp.headers.set(
    'Cache-Control',
    `public, max-age=${CACHE_CONFIG.browserTTL}`
  );
  newResp.headers.set(
    'CDN-Cache-Control',
    `public, max-age=${CACHE_CONFIG.edgeTTL}`
  );
  newResp.headers.set('Access-Control-Allow-Origin', '*');

  event.waitUntil(cache.put(cacheKey, newResp.clone()));
  return newResp;
}
