const http = require('http');
const fs = require('fs');
const path = require('path');

// Basic .env file parser for local environment variables
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env file:', e.message);
}

const authHandler = require('./api/auth');
const orderHandler = require('./api/order');
const settingsHandler = require('./api/settings');
const uploadHandler = require('./api/upload');
const productsHandler = require('./api/products');
const categoriesHandler = require('./api/categories');
const cartsHandler = require('./api/carts');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Mock Vercel response object helpers
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Parse request body for POST/PUT requests
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = body;
      }
    }

    const cleanUrl = req.url.split('?')[0];

    // Routing for serverless API handlers
    if (cleanUrl === '/api/auth') {
      authHandler(req, res);
    } else if (cleanUrl === '/api/order' || cleanUrl === '/api/orders') {
      orderHandler(req, res);
    } else if (cleanUrl === '/api/products') {
      productsHandler(req, res);
    } else if (cleanUrl === '/api/categories') {
      categoriesHandler(req, res);
    } else if (cleanUrl === '/api/carts') {
      cartsHandler(req, res);
    } else if (cleanUrl === '/api/settings') {
      settingsHandler(req, res);
    } else if (cleanUrl === '/api/upload') {
      uploadHandler(req, res);
    } else {
      // Serve static frontend files
      let filePath = cleanUrl === '/' ? '/index.html' : cleanUrl;
      filePath = path.join(__dirname, filePath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Not Found');
        } else {
          const ext = path.extname(filePath).toLowerCase();
          res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
          res.end(data);
        }
      });
    }
  });
});

const PORT = 60263;
server.listen(PORT, () => {
  console.log(`Local development server running at http://localhost:${PORT}`);
});
