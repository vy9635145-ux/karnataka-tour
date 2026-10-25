'use strict';
const fs = require('node:fs');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'
};

function notFound(req, res, root) {
  const wantsHtml = (req.headers.accept || '').includes('text/html');
  const f404 = path.join(root, '404.html');
  if (wantsHtml && fs.existsSync(f404)) {
    const body = fs.readFileSync(f404);
    res.writeHead(404, { 'Content-Type': MIME['.html'], 'Content-Length': body.length });
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function serveStatic(req, res, pathname, cfg) {
  const root = cfg.publicDir;
  let p;
  try { p = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (p.includes('\0')) { res.writeHead(400); return res.end('Bad request'); }
  let rel = path.posix.normalize(p);
  if (rel.split('/').some((seg) => seg.startsWith('.'))) return notFound(req, res, root); // no dotfiles
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.join(root, rel);
  if (file !== root && !file.startsWith(root + path.sep)) return notFound(req, res, root);

  let st;
  try { st = fs.statSync(file); } catch { return notFound(req, res, root); }
  if (st.isDirectory()) { file = path.join(file, 'index.html'); try { st = fs.statSync(file); } catch { return notFound(req, res, root); } }

  const ext = path.extname(file).toLowerCase();
  const etag = `W/"${st.size}-${Math.floor(st.mtimeMs)}"`;
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': st.size,
    ETag: etag,
    'Last-Modified': st.mtime.toUTCString(),
    'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=86400'
  };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag }); return res.end(); }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

module.exports = { serveStatic };
