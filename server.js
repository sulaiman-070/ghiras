/**
 * GHIRAS — Simple Dev Server
 * Run: node server.js
 * Then open: http://localhost:5500
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = 5500;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let filePath = path.join(ROOT, parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end(`File not found: ${parsedUrl.pathname}`);
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🌿 غِراس — GHIRAS Dev Server    ║
║   http://localhost:${PORT}           ║
╚════════════════════════════════════╝
  `);
});
