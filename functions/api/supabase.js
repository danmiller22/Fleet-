// Supabase REST helpers for Cloudflare Pages Functions
// Uses env SUPABASE_URL and SUPABASE_KEY (service or anon)

function getConfig(env){
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_KEY || env.SUPABASE_SERVICE_ROLE || env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

export function isConfigured(env){
  const { url, key } = getConfig(env);
  return !!(url && key);
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

export async function list(env, table){
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase list ${table} ${r.status}`);
  return r.json();
}

export async function getOne(env, table, id){
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase get ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}

export async function create(env, table, payload){
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}`, { method:'POST', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase create ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || payload;
}

export async function update(env, table, id, payload){
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'PATCH', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase update ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}

export async function remove(env, table, id){
  const { url } = getConfig(env);
  const r = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers: headers(env) });
  return r.ok;
}

