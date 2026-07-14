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

  // Buffer the body so the request can be retried while the free-tier
  // API cold-starts (Render answers 502 until the instance is awake).
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    const attempt = (triesLeft) => {
      const proxyReq = httpsRequest(
        targetUrl,
        { method: req.method, headers },
        (proxyRes) => {
          const isWakingUp = [502, 503, 504].includes(proxyRes.statusCode);
          if (isWakingUp) {
            proxyRes.resume(); // discard interstitial body
            if (triesLeft > 0) {
              console.log(`[PROXY] Upstream ${proxyRes.statusCode}, retrying (${triesLeft} left)…`);
              setTimeout(() => attempt(triesLeft - 1), 8000);
              return;
            }
            // Retries exhausted: answer JSON, not Render's HTML interstitial
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({ success: false, error: 'Server is waking up — please try again in a moment' })
            );
            return;
          }
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        if (triesLeft > 0) {
          console.log(`[PROXY] ${err.message}, retrying (${triesLeft} left)…`);
          setTimeout(() => attempt(triesLeft - 1), 8000);
          return;
        }
        console.error('[PROXY] Upstream error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({ success: false, error: 'Server is waking up — please try again in a moment' })
        );
      });

      proxyReq.end(body);
    };

    attempt(4); // up to ~32s of retries, enough to ride out a cold start
  });
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
