/**
 * GitHub 加速服务 - Cloudflare Workers
 * 单文件版本，包含所有功能
 */

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub 加速服务</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: url(https://t.alcy.cc/ycy) center/cover no-repeat fixed;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 32px;
            max-width: 800px;
            width: 100%;
        }

        h1 {
            color: #24292e;
            margin-bottom: 8px;
            font-size: 24px;
            font-weight: 600;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .input-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }

        input[type="text"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }

        button {
            flex: 1;
            padding: 10px 20px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            background: #fafbfc;
            color: #24292e;
            transition: background 0.2s;
        }

        button:hover {
            background: #f3f4f6;
        }

        .primary {
            background: #2ea44f;
            color: white;
            border-color: rgba(27,31,35,0.15);
        }

        .primary:hover {
            background: #2c974b;
        }

        .secondary {
            background: #f5f5f5;
            color: #333;
        }

        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            display: none;
        }

        .result.show {
            display: block;
        }

        .result h3 {
            color: #333;
            margin-bottom: 10px;
        }

        .result a {
            color: #667eea;
            word-break: break-all;
        }

        .features {
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .feature {
            padding: 16px;
            background: #f6f8fa;
            border-radius: 6px;
            text-align: center;
        }

        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .feature-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }

        .feature-desc {
            color: #666;
            font-size: 14px;
        }

        .routes {
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .route {
            padding: 16px;
            background: #f6f8fa;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
            border: 1px solid #e1e4e8;
        }

        .route:hover {
            background: #f3f4f6;
        }

        .route.selected {
            border-color: #0366d6;
            background: #f1f8ff;
        }

        .route-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .route-name {
            font-weight: 600;
            color: #333;
        }

        .route-latency {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .route-latency.excellent {
            background: #d4edda;
            color: #155724;
        }

        .route-latency.good {
            background: #fff3cd;
            color: #856404;
        }

        .route-latency.fair {
            background: #f8d7da;
            color: #721c24;
        }

        .route-latency.testing {
            background: #e2e3e5;
            color: #383d41;
        }

        .route-url {
            color: #666;
            font-size: 12px;
            word-break: break-all;
        }

        .refresh-btn {
            margin-top: 10px;
            padding: 6px 16px;
            background: #f6f8fa;
            color: #24292e;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
        }

        .refresh-btn:hover {
            background: #f3f4f6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GitHub 加速服务</h1>
        <p class="subtitle">通过 Cloudflare Workers + 腾讯云 EdgeOne 加速 GitHub 内容访问</p>

        <div class="input-group">
            <label for="url">GitHub 链接</label>
            <input type="text" id="url" placeholder="https://github.com/user/repo/archive/refs/heads/main.zip">
        </div>

        <div class="button-group">
            <button class="primary" onclick="generateUrl()">生成加速链接</button>
            <button class="secondary" onclick="clearUrl()">清空</button>
        </div>

        <div class="result" id="result">
            <h3>加速链接：</h3>
            <a id="acceleratedUrl" href="#" target="_blank"></a>
        </div>

        <div style="margin: 30px 0; border-top: 1px solid #e1e4e8;"></div>

        <div class="input-group">
            <label for="username">GitHub 用户名</label>
            <input type="text" id="username" placeholder="输入用户名">
        </div>

        <div class="button-group">
            <button class="primary" onclick="generateUserUrl()">生成用户主页加速链接</button>
            <button class="secondary" onclick="clearUsername()">清空</button>
        </div>

        <div class="result" id="userResult">
            <h3>用户主页加速链接：</h3>
            <a id="userAcceleratedUrl" href="#" target="_blank"></a>
        </div>

        <div class="route-info">
            <p style="text-align: center; color: #666; margin-bottom: 10px;">
                加速域名: <strong>github.1zyq1.com</strong>
            </p>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">📦</div>
                <div class="feature-title">文件加速</div>
                <div class="feature-desc">加速 GitHub 文件下载</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <div class="feature-title">全球加速</div>
                <div class="feature-desc">使用 Cloudflare 和 Edgeone CDN</div>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">高速稳定</div>
                <div class="feature-desc">稳定可靠的加速服务</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🔒</div>
                <div class="feature-title">安全可靠</div>
                <div class="feature-desc">HTTPS 加密传输</div>
            </div>
        </div>
    </div>

    <script>
        const ACCELERATOR_DOMAIN = 'https://github.1zyq1.com';

        function generateUrl() {
            const input = document.getElementById('url').value;
            const resultDiv = document.getElementById('result');
            const acceleratedUrl = document.getElementById('acceleratedUrl');

            if (!input) {
                alert('请输入 GitHub 链接');
                return;
            }

            try {
                const url = new URL(input);
                // 支持原始GitHub域名和加速域名
                const isValidHost = url.hostname.includes('github.com') || 
                                   url.hostname.includes('github.1zyq1.com') ||
                                   url.hostname.includes('github.1zyq1.com');
                
                if (!isValidHost) {
                    alert('请输入有效的 GitHub 链接');
                    return;
                }

                // 生成加速链接
                const accelerated = ACCELERATOR_DOMAIN + url.pathname + url.search;
                acceleratedUrl.href = accelerated;
                acceleratedUrl.textContent = accelerated;
                resultDiv.classList.add('show');
            } catch (e) {
                alert('无效的 URL 格式');
            }
        }

        function clearUrl() {
            document.getElementById('url').value = '';
            document.getElementById('result').classList.remove('show');
        }

        function clearUsername() {
            document.getElementById('username').value = '';
            document.getElementById('userResult').classList.remove('show');
        }

        function generateUserUrl() {
            const username = document.getElementById('username').value;
            const resultDiv = document.getElementById('userResult');
            const acceleratedUrl = document.getElementById('userAcceleratedUrl');

            if (!username) {
                alert('请输入 GitHub 用户名');
                return;
            }

            const accelerated = ACCELERATOR_DOMAIN + '/' + username;
            acceleratedUrl.href = accelerated;
            acceleratedUrl.textContent = accelerated;
            resultDiv.classList.add('show');
        }

        function selectRoute(routeNum) {
            selectedRoute = routeNum;
            document.querySelectorAll('.route').forEach(route => {
                route.classList.remove('selected');
            });
            document.getElementById('route' + routeNum).classList.add('selected');
            
            // 如果已经生成了GitHub链接，重新生成
            const resultDiv = document.getElementById('result');
            if (resultDiv.classList.contains('show')) {
                const urlInput = document.getElementById('url').value;
                if (urlInput) {
                    generateUrl();
                }
            }

            // 如果已经生成了用户主页链接，重新生成
            const userResultDiv = document.getElementById('userResult');
            if (userResultDiv.classList.contains('show')) {
                const usernameInput = document.getElementById('username').value;
                if (usernameInput) {
                    generateUserUrl();
                }
            }
        }

        async function testLatency() {
            const latency1 = document.getElementById('latency1');
            const latency2 = document.getElementById('latency2');
            
            latency1.className = 'route-latency testing';
            latency2.className = 'route-latency testing';
            latency1.textContent = '测试中...';
            latency2.textContent = '测试中...';

            // 测试路线1
            try {
                const start1 = performance.now();
                await fetch(routes[1] + '/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
                const end1 = performance.now();
                const latency1Value = Math.round(end1 - start1);
                latency1.textContent = latency1Value + 'ms';
                latency1.className = 'route-latency ' + getLatencyClass(latency1Value);
            } catch (e) {
                latency1.textContent = '测试失败';
                latency1.className = 'route-latency fair';
            }

            // 测试路线2
            try {
                const start2 = performance.now();
                await fetch(routes[2] + '/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
                const end2 = performance.now();
                const latency2Value = Math.round(end2 - start2);
                latency2.textContent = latency2Value + 'ms';
                latency2.className = 'route-latency ' + getLatencyClass(latency2Value);
            } catch (e) {
                latency2.textContent = '测试失败';
                latency2.className = 'route-latency fair';
            }
        }

        // 支持回车键提交
        document.getElementById('url').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateUrl();
            }
        });
    </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      const requestOrigin = request.headers.get('Origin') || 'https://github.1zyq1.com';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': requestOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // 如果访问根路径，返回 HTML 页面
    if (pathname === '/') {
      return new Response(HTML_CONTENT, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }
    
    // 处理 GitHub 请求
    const githubUrl = `https://github.com${pathname}${url.search}`;
    
    // 安全重定向：对敏感路径进行重定向
    const sensitivePaths = ['/login', '/logout', '/session', '/settings', '/account'];
    const isSensitivePath = sensitivePaths.some(path => pathname.startsWith(path));
    
    if (isSensitivePath) {
      return new Response('出于安全考虑，敏感页面请直接访问 GitHub: <a href="https://github.com' + pathname + '">https://github.com' + pathname + '</a>', {
        status: 403,
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      });
    }
    
    // 预设置请求头，提升性能
    const requestHeaders = new Headers();
    requestHeaders.set('Host', 'github.com');
    requestHeaders.set('Referer', 'https://github.com/');
    requestHeaders.set('User-Agent', request.headers.get('User-Agent') || 'Mozilla/5.0');
    requestHeaders.set('Accept', request.headers.get('Accept') || '*/*');
    requestHeaders.set('Accept-Encoding', 'gzip, deflate, br');
    requestHeaders.set('Connection', 'keep-alive');
    
    try {
      // 使用更高效的fetch配置，添加缓存和压缩支持
      const response = await fetch(githubUrl, {
        method: request.method,
        headers: requestHeaders,
        cf: {
          cacheTtl: 3600,
          cacheEverything: true,
          cacheKey: githubUrl,
        },
      });
      
      // 创建新的响应，处理HTML内容以替换资源链接
      const contentType = response.headers.get('content-type') || '';
      let responseBody;
      
      if (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('javascript')) {
        // 对于HTML、CSS和JavaScript内容，替换资源链接
        const text = await response.text();
        const host = url.hostname;
        const protocol = url.protocol;
        const origin = `${protocol}//${host}`;
        
        // 替换所有github.com的链接为当前域名
        const modifiedText = text
          // 替换绝对路径
          .replace(/https:\/\/github\.com/g, origin)
          .replace(/http:\/\/github\.com/g, origin)
          // 替换相对路径
          .replace(/href="\//g, `href="${origin}/`)
          .replace(/src="\//g, `src="${origin}/`)
          .replace(/action="\//g, `action="${origin}/`)
          // 替换content属性中的路径
          .replace(/content="https:\/\/github\.com/g, `content="${origin}`)
          .replace(/content="http:\/\/github\.com/g, `content="${origin}`)
          .replace(/content="\//g, `content="${origin}/`)
          // 替换data属性中的路径
          .replace(/data-url="\//g, `data-url="${origin}/`)
          .replace(/data-href="\//g, `data-href="${origin}/`);
        
        responseBody = modifiedText;
      } else {
        // 非HTML内容直接传递
        responseBody = response.body;
      }
      
      const newResponse = new Response(responseBody, response);
      
      // 添加性能优化头部
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');
      
      // 设置 CORS 头部 - 根据请求来源动态设置
      const requestOrigin = request.headers.get('Origin') || 'https://github.1zyq1.com';
      newResponse.headers.set('Access-Control-Allow-Origin', requestOrigin);
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      newResponse.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

      // 移除 Content Security Policy 头部，允许从加速域名加载资源
      newResponse.headers.delete('Content-Security-Policy');
      newResponse.headers.delete('Content-Security-Policy-Report-Only');
      
      // 优化缓存控制 - 根据内容类型设置不同的缓存时间
      if (contentType.includes('image/') || contentType.includes('font/')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=86400, immutable'); // 24小时
      } else if (contentType.includes('text/css') || contentType.includes('javascript')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=3600'); // 1小时
      } else if (contentType.includes('application/zip') || contentType.includes('application/octet-stream') || contentType.includes('application/x-')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=86400, immutable'); // 二进制文件缓存24小时
      } else {
        newResponse.headers.set('Cache-Control', 'public, max-age=1800'); // 30分钟
      }
      
      // 添加性能优化头部
      newResponse.headers.set('Vary', 'Accept-Encoding');
      
      return newResponse;
    } catch (error) {
      return new Response('Error: ' + error.message, {
        status: 500,
        headers: {
          'content-type': 'text/plain;charset=UTF-8',
        },
      });
    }
  },
};
