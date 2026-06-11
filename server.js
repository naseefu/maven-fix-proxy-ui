const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

app.prepare().then(() => {
  createServer((req, res) => {
    // Jupyter Server Proxy strips the base path before passing the request to port 3000.
    // Next.js needs the base path to be present to correctly match routes when basePath is configured.
    // So we manually prepend it if it's missing!
    if (basePath && !req.url.startsWith(basePath)) {
      req.url = basePath + req.url;
    }
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:3000 (with proxy rewrite for ${basePath})`);
  });
});
