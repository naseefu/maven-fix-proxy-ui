const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const fs = require('fs');
const path = require('path');

let envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const match = envFile.match(/^NEXT_PUBLIC_BASE_PATH=(.*)$/m);
  if (match) {
    envBasePath = match[1].trim();
  }
} catch (e) {
  // .env.local might not exist, that's fine
}

const basePath = envBasePath;

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // If Next.js is configured with a basePath, it expects ALL incoming requests to start with that basePath.
      // However, some AMD/Enterprise port forwarding proxies strip the base path before sending the request to localhost.
      // If the request doesn't have the basePath, we artificially prepend it so Next.js routing doesn't 404.
      if (basePath && !req.url.startsWith(basePath)) {
        req.url = `${basePath}${req.url}`;
        parsedUrl.pathname = `${basePath}${parsedUrl.pathname}`;
        parsedUrl.path = `${basePath}${parsedUrl.path}`;
        parsedUrl.href = `${basePath}${parsedUrl.href}`;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      if (basePath) {
        console.log(`> Using basePath: ${basePath}`);
        console.log(`> Handling stripped proxy requests automatically.`);
      }
    });
});
