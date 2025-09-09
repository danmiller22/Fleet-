const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5173;
const root = process.cwd();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const url = decodeURI((req.url || '/').split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.replace(/^\//, '');
  const file = path.join(root, rel);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain; charset=utf-8');
    fs.createReadStream(file).on('error', () => {
      res.statusCode = 500;
      res.end('Error reading file');
    }).pipe(res);
  });
}).listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});

