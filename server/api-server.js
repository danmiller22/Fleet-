// Minimal dependency-free REST API server (free to use)
// Endpoints: /api/{trucks|trailers|repairs|expenses} and /api/{collection}/{id}

const http = require('http');
const url = require('url');
const { loadDB, saveDB, ensureDB, uid } = require('./db');

const PORT = process.env.API_PORT || 3000;
const collections = new Set(['trucks','trailers','repairs','expenses']);

ensureDB();

function send(res, code, body, headers={}){
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function notFound(res){ send(res, 404, { error:'Not found' }); }
function badRequest(res, msg='Bad request'){ send(res, 400, { error: msg }); }

function parseBody(req){
  return new Promise((resolve, reject)=>{
    let data='';
    req.on('data', c=> data += c);
    req.on('end', ()=>{
      if(!data){ resolve({}); return; }
      try { resolve(JSON.parse(data)); } catch(e){ reject(e); }
    });
    req.on('error', reject);
  });
}

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if(req.method === 'OPTIONS'){ res.writeHead(204); res.end(); return; }

  const parsed = url.parse(req.url, true);
  const parts = (parsed.pathname||'').replace(/^\/+|\/+$/g,'').split('/');

  if(parts[0] !== 'api'){ return notFound(res); }
  const col = parts[1];
  const id  = parts[2];
  if(!collections.has(col)) return notFound(res);

  let db = loadDB();

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
      const rec = { id: uid(), ...payload };
      db[col].unshift(rec);
      saveDB(db);
      return send(res, 201, rec);
    }
    if(req.method === 'PUT' && id){
      const payload = await parseBody(req);
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
  console.log(`API server listening on http://localhost:${PORT}`);
});

