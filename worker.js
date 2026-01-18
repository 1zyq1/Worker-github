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
  browserTTL: 60 * 60 * 24 * 1, // 7 天
  edgeTTL: 60 * 60 * 24 * 7,  // 30 天
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
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
background:url(https://t.alcy.cc/ycy) center/cover no-repeat fixed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
padding:20px}
.container{background:rgba(255,255,255,0.15);border-radius:12px;
box-shadow:0 8px 24px rgba(0,0,0,0.15);width:100%;max-width:560px;padding:36px;
backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.2)}
.header{text-align:center;margin-bottom:28px}
.logo{width:72px;height:72px;background:#24292e;
border-radius:8px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center}
.logo i{font-size:36px;color:#fff}
.title{font-size:26px;font-weight:600;color:#24292e;margin-bottom:6px}
.subtitle{font-size:14px;color:#586069}
.input-group{position:relative;margin-bottom:16px}
.input-group i{position:absolute;left:14px;top:50%;transform:translateY(-50%);
color:#959da5;font-size:16px}
.input-group input{width:100%;padding:14px 14px 14px 44px;border:1px solid #e1e4e8;
border-radius:6px;font-size:15px;outline:none;background:#fafbfc;color:#24292e}
.input-group input:focus{border-color:#0366d6;background:#fff}
.button-group{display:flex;gap:10px;margin-bottom:20px}
.btn{flex:1;padding:12px 18px;border:none;border-radius:6px;
font-size:15px;font-weight:500;cursor:pointer;
display:flex;align-items:center;justify-content:center;gap:8px}
.btn-primary{background:#0366d6;color:#fff}
.btn-primary:hover{background:#0256c3}
.btn-secondary{background:#fff;color:#24292e;border:1px solid #e1e4e8}
.btn-secondary:hover{background:#f3f4f6}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}
.feature-item{text-align:center;padding:12px;background:#f6f8fa;border-radius:6px}
.feature-item i{font-size:20px;color:#0366d6;margin-bottom:6px}
.feature-item span{font-size:13px;color:#586069}
.loading{display:none;position:fixed;top:0;left:0;right:0;bottom:0;
background:rgba(0,0,0,0.6);z-index:999;align-items:center;justify-content:center}
.loading-spinner{width:40px;height:40px;border:3px solid #fff;
border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:480px){
  .container{padding:20px}
  .title{font-size:22px}
  .features{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">
      <i class="fab fa-github"></i>
    </div>
    <h1 class="title">GitHub 加速下载</h1>
    <p class="subtitle">快速、稳定、可靠的 GitHub 资源加速服务</p>
  </div>

  <div class="input-group">
    <i class="fas fa-link"></i>
    <input type="text" id="url" placeholder="输入 GitHub 资源链接..." />
  </div>

  <div class="button-group">
    <button class="btn btn-primary" onclick="go()">
      <i class="fas fa-bolt"></i> 立即加速
    </button>
    <button class="btn btn-secondary" onclick="pasteUrl()">
      <i class="fas fa-paste"></i> 粘贴链接
    </button>
  </div>

  <div class="features">
    <div class="feature-item">
      <i class="fas fa-download"></i>
      <span>Release 加速</span>
    </div>
    <div class="feature-item">
      <i class="fas fa-file-code"></i>
      <span>Raw 文件</span>
    </div>
    <div class="feature-item">
      <i class="fas fa-archive"></i>
      <span>Archive 压缩包</span>
    </div>
  </div>
</div>

<div class="loading" id="loading">
  <div class="loading-spinner"></div>
</div>

<script>
async function pasteUrl(){
  try{
    const text=await navigator.clipboard.readText();
    document.getElementById('url').value=text;
  }catch(e){
    alert('无法访问剪贴板，请手动粘贴');
  }
}

function showLoading(){
  document.getElementById('loading').style.display='flex';
}

function hideLoading(){
  document.getElementById('loading').style.display='none';
}

function go(){
  const v=document.getElementById('url').value.trim();
  if(!v)return alert('请输入 GitHub 链接');
  try{
    const u=new URL(v);
    const base=location.origin;
    let targetUrl;
    if(u.hostname==='raw.githubusercontent.com'){
      targetUrl=base+'/raw'+u.pathname;
    }else if(u.hostname==='github.com'){
      targetUrl=base+u.pathname;
    }else{
      return alert('请输入有效的 GitHub 链接');
    }
    // 使用 window.open 而不是 window.location.href
    // 这样可以在新窗口/标签页打开，不会影响当前页面
    const newWindow = window.open(targetUrl, '_blank');
    if(!newWindow){
      alert('请允许弹出窗口以继续下载');
    }
  }catch(e){
    alert('链接格式错误，请检查后重试');
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
