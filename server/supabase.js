// Minimal Supabase REST helpers for Node API
// Uses service role key or anon key from env

function getConfig(env){
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_KEY || env.SUPABASE_SERVICE_ROLE || env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

function ensureFetch(){
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node 18+ or polyfill.');
  }
}

function headers(env){
  const { key } = getConfig(env);
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

function isConfigured(env){
  const { url, key } = getConfig(env);
  return !!(url && key);
}

async function list(env, table){
  ensureFetch();
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase list ${table} ${r.status}`);
  return r.json();
}
async function getOne(env, table, id){
  ensureFetch();
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase get ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}
async function create(env, table, payload){
  ensureFetch();
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}`, { method:'POST', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase create ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || payload;
}
async function update(env, table, id, payload){
  ensureFetch();
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'PATCH', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase update ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}
async function remove(env, table, id){
  ensureFetch();
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers: headers(env) });
  return r.ok;
}

module.exports = { isConfigured, list, getOne, create, update, remove };

