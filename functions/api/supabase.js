import { json } from './_utils';

export function isConfigured(env){
  return !!(env.SUPABASE_URL && env.SUPABASE_KEY);
}

function headers(env){
  return {
    'apikey': env.SUPABASE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

export async function list(env, table){
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase list ${table} ${r.status}`);
  return r.json();
}
export async function getOne(env, table, id){
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*`, { headers: headers(env) });
  if(!r.ok) throw new Error(`supabase get ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}
export async function create(env, table, payload){
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, { method:'POST', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase create ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || payload;
}
export async function update(env, table, id, payload){
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'PATCH', headers: headers(env), body: JSON.stringify(payload) });
  if(!r.ok) throw new Error(`supabase update ${table} ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}
export async function remove(env, table, id){
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers: headers(env) });
  return r.ok;
}

