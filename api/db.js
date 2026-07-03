const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.join(__dirname, '..', 'data');
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

const isCloud = !!(JSONBIN_API_KEY && JSONBIN_BIN_ID);

// ─── LOCAL FILE HELPERS (development only) ───────────────────────────────────
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readDataLocal(filename, defaultVal) {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeDataLocal(filename, data) {
  ensureDataDir();
  try {
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// ─── JSONBIN HELPERS (production / Vercel) ───────────────────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({}); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fetchBin() {
  const result = await httpsRequest({
    hostname: 'api.jsonbin.io',
    path: `/v3/b/${JSONBIN_BIN_ID}/latest`,
    method: 'GET',
    headers: { 'X-Master-Key': JSONBIN_API_KEY }
  });
  return result.record || {};
}

async function updateBin(record) {
  const body = JSON.stringify(record);
  await httpsRequest({
    hostname: 'api.jsonbin.io',
    path: `/v3/b/${JSONBIN_BIN_ID}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
// filename: e.g. 'products.json'
// defaultVal: fallback if key doesn't exist yet

async function readData(filename, defaultVal) {
  const key = filename.replace('.json', '');
  if (!isCloud) {
    return readDataLocal(filename, defaultVal);
  }
  const bin = await fetchBin();
  return bin[key] !== undefined ? bin[key] : defaultVal;
}

async function writeData(filename, data) {
  const key = filename.replace('.json', '');
  if (!isCloud) {
    return writeDataLocal(filename, data);
  }
  const bin = await fetchBin();
  bin[key] = data;
  await updateBin(bin);
  return true;
}

module.exports = { readData, writeData, isCloud };

