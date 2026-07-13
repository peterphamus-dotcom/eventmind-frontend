import { createServer } from 'http';
import { request as httpsRequest } from 'https';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, 'dist');
const port = process.env.PORT || 3000;

// API requests are proxied server-side so the browser only ever talks
// to this origin. Without this, the session cookie is third-party
// (frontend and API live on different onrender.com subdomains) and
// Safari/iOS blocks it entirely, breaking auth on iPhones.
const API_ORIGIN = process.env.API_ORIGIN || 'https://eventmind-api.onrender.com';

function proxyToApi(req, res) {
  const targetUrl = new URL(req.url.replace(/^\/api/, '') || '/', API_ORIGIN);
  const headers = { ...req.headers, host: targetUrl.host };

  const proxyReq = httpsRequest(
    targetUrl,
    { method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[PROXY] Upstream error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, error: 'API unavailable, please retry' }));
  });

  req.pipe(proxyReq);
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  // Same-origin API proxy (see note above)
  if (req.url === '/api' || req.url.startsWith('/api/')) {
    proxyToApi(req, res);
    return;
  }

  let filePath = join(distDir, req.url);

  // Remove query string for file lookup
  filePath = filePath.split('?')[0];

  // Default to index.html for SPA routing
  if (filePath.endsWith('/')) {
    filePath = join(filePath, 'index.html');
  }

  try {
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const content = readFileSync(filePath);
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    // Route to index.html for SPA (client-side routing)
    try {
      const content = readFileSync(join(distDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
