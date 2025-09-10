// Minimal static + API server for Fleet/TranGo demo
// - Serves SPA files from repo root
// - Provides REST API at /api/:collection[/:id]
// - Collections: trucks, trailers, cases, expenses
// - Persists data to JSON at server/db.json (auto-seeded)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(__dirname, 'db.json');
const collections = new Set(['trucks','trailers','cases','expenses']);

function uid(){ return Math.random().toString(36).slice(2,9); }

function seedData(){
  const now = Date.now();
  return {
    trucks: [
      { id: '3252', make: 'Freightliner', model: 'Cascadia', year: 2021, vin: '1FUJHHDR0MLMJ4879', status: 'Active', miles: 618230, pmInterval: 20000, pmDueAt: 618230, notes: 'Oil change due now' },
      { id: '5496', make: 'Volvo', model: 'VNL',       year: 2024, vin: '4V4NC9EH0LN223912', status: 'Active', miles: 409659, pmInterval: 20000, pmDueAt: 409659, notes: 'Windshield replaced 2025-09-04' },
    ],
    trailers: [
      { id: 'XTRA-40123', type: 'Dry Van', owner: 'XTRA Lease', status: 'On Road', extId: 'SkyB-12345', notes: 'External tracked' },
      { id: 'UST-9001',   type: 'Dry Van', owner: 'US TEAM',    status: 'Yard',    extId: 'UST-9001',  notes: 'Ready' },
    ],
    cases: [
      { id: uid(), assetType: 'truck',   assetId: '3252',       title: 'Coolant leak', priority: 'High',   stage: 'Diagnose', createdAt: now - 86400000*2, cost: 0,  assigned: 'Jack',  timeline: [ { t: now - 86400000*2, note: 'Driver reports coolant on ground.' } ], invoices: [] },
      { id: uid(), assetType: 'trailer', assetId: 'XTRA-40123', title: 'ABS light ON',  priority: 'Medium', stage: 'Parts',    createdAt: now - 86400000*1, cost: 75, assigned: 'Aidar', timeline: [ { t: now - 86400000,   note: 'Mobile tech scheduled.' } ], invoices: [] }
    ],
    expenses: [
      { id: uid(), type: 'expense', amount: 535,  category: 'Tires',      note: 'Steer tire fix — Houston, TX',  ref: '2023/00' },
      { id: uid(), type: 'expense', amount: 325,  category: 'Windshield', note: 'Windshield mobile — Wichita, KS', ref: '2025/09/04' },
      { id: uid(), type: 'income',  amount: 4200, category: 'Load',       note: 'Load #AB-778, Jack',             ref: '2025/09/03' },
    ],
  };
}

function loadDB(){
  try{
    if(!fs.existsSync(DB_PATH)){
      const seeded = seedData();
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
      return seeded;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  }catch(e){
    console.error('DB load error', e);
    return seedData();
  }
}

function saveDB(db){
  try{ fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
  catch(e){ console.error('DB save error', e); }
}

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, data, headers={}){
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function notFound(res){ send(res, 404, { error: 'Not found' }); }
function badRequest(res, msg='Bad request'){ send(res, 400, { error: msg }); }

function serveStatic(req, res){
  // Map URL to file path; default to index.html
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  if(pathname.startsWith('/api')) return false; // not static
  if(pathname === '/') pathname = '/index.html';
  const filePath = path.join(ROOT, pathname);
  if(!filePath.startsWith(ROOT)) return badRequest(res); // path traversal guard
  try{
    const stat = fs.statSync(filePath);
    if(stat.isDirectory()) return false;
    const ext = path.extname(filePath).toLowerCase();
    const ctype = ({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'})[ext] || 'application/octet-stream';
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': ctype, 'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600' });
    res.end(buf);
    return true;
  }catch(_){
    // Fallback SPA index.html for unknown routes
    try{
      const buf = fs.readFileSync(path.join(ROOT, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control':'no-store' });
      res.end(buf);
      return true;
    }catch(e){ return false; }
  }
}

async function parseBody(req){
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}

function getAllowedTokens(){
  const env = process.env.AUTH_TOKENS || process.env.ALLOWED_TOKENS || '';
  const list = env.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean);
  if(list.length) return new Set(list);
  try{
    const p = path.resolve(__dirname, 'allowlist.json');
    if(fs.existsSync(p)){
      const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
      if(Array.isArray(arr)) return new Set(arr.map(String));
    }
  }catch{}
  return null; // no auth configured
}

const allowedTokens = getAllowedTokens();

function authOk(req){
  if(!allowedTokens || allowedTokens.size===0) return true; // open if not configured
  const h = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h||'');
  const token = m && m[1];
  return token && allowedTokens.has(token);
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if(req.method === 'OPTIONS'){ res.writeHead(204); res.end(); return; }

  // Try static first
  if(serveStatic(req, res)) return;

  const parsed = url.parse(req.url, true);
  const parts = (parsed.pathname||'').replace(/^\/+|\/+$/g,'').split('/');

  if(parts[0] !== 'api'){ return notFound(res); }
  if(parts[1]==='auth' && parts[2]==='check'){
    if(!authOk(req)) return send(res, 401, { ok:false });
    return send(res, 200, { ok:true });
  }
  if(!authOk(req)) return send(res, 401, { error:'Unauthorized' });
  const col = parts[1];
  const id  = parts[2];
  if(!collections.has(col)) return notFound(res);

  let db = loadDB();
  if(!db[col]) db[col] = [];

  try{
    if(req.method === 'GET' && !id){
      return send(res, 200, db[col]);
    }
    if(req.method === 'GET' && id){
      const rec = db[col].find(x=> String(x.id) === String(id));
      return rec ? send(res, 200, rec) : notFound(res);
    }
    if(req.method === 'POST' && !id){
      const payload = await parseBody(req);
      if(!payload || typeof payload !== 'object') return badRequest(res, 'Invalid JSON');
      const rec = { id: payload.id || uid(), ...payload };
      db[col].unshift(rec);
      saveDB(db);
      return send(res, 201, rec);
    }
    if(req.method === 'PUT' && id){
      const payload = await parseBody(req);
      if(!payload || typeof payload !== 'object') return badRequest(res, 'Invalid JSON');
      const i = db[col].findIndex(x=> String(x.id) === String(id));
      if(i === -1) return notFound(res);
      db[col][i] = { ...db[col][i], ...payload, id: db[col][i].id };
      saveDB(db);
      return send(res, 200, db[col][i]);
    }
    if(req.method === 'DELETE' && id){
      const before = db[col].length;
      db[col] = db[col].filter(x=> String(x.id) !== String(id));
      if(db[col].length === before) return notFound(res);
      saveDB(db);
      return send(res, 204, '');
    }
    return badRequest(res);
  }catch(err){
    console.error(err);
    return send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Fleet server running on http://localhost:${PORT}`);
});

