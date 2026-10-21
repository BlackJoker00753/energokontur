// Локальный сервер для разработки: node serve.js → http://localhost:8791/ (раздаёт public/ после node build.js)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, 'public'), port = +process.env.PORT || 8791;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end('not found') }
  const stat = fs.statSync(f), type = types[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
  if (range && type === 'video/mp4') { const [a, b] = range.replace('bytes=', '').split('-'), s = +a, e = b ? +b : stat.size - 1; res.writeHead(206, { 'Content-Range': `bytes ${s}-${e}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1, 'Content-Type': type }); return fs.createReadStream(f, { start: s, end: e }).pipe(res) }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('http://localhost:' + port + '/'));
