import { collections, json, corsHeaders, notFound, badRequest, ensureSeed, readCol, writeCol, uid, requireAuth, users, computeToken } from './_utils';
import { isConfigured as supaReady, list as sList, getOne as sGet, create as sCreate, update as sUpdate, remove as sDelete } from './supabase';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/+|\/+$/g,'').split('/'); // e.g., ['api','trucks','id']

  // CORS preflight
  if (request.method === 'OPTIONS') return new Response('', { status:204, headers: corsHeaders() });

  if (parts[0] !== 'api') return notFound();
  // auth routes
  if(parts[1]==='auth' && parts[2]==='login' && request.method==='POST'){
    const body = await request.json().catch(()=>({})) || {};
    const login = String(body.login||'').trim();
    const password = String(body.password||'');
    const us = users(env);
    const ok = us.find(u => (u.login||'').toLowerCase()===login.toLowerCase() && String(u.password)===password);
    if(!ok) return json({ error:'Invalid credentials' }, { status:401 });
    const token = await computeToken(env, login, password);
    return json({ token, user:{ login: ok.login } });
  }
  if(parts[1]==='auth' && parts[2]==='check'){
    return (await requireAuth(env, request)) ? json({ ok:true }) : json({ ok:false }, { status:401 });
  }
  if(!(await requireAuth(env, request))) return json({ error:'Unauthorized' }, { status:401 });

  const col = parts[1];
  const id  = parts[2];
  if (!collections.includes(col)) return notFound();

  const useSupa = supaReady(env);
  if(!useSupa){
    await ensureSeed(env);
  }

  try {
    if (request.method === 'GET' && !id) {
      const items = useSupa ? await sList(env, col) : await readCol(env, col);
      return json(items);
    }
    if (request.method === 'GET' && id) {
      if(useSupa){
        const rec = await sGet(env, col, id);
        return rec ? json(rec) : notFound();
      } else {
        const items = await readCol(env, col);
        const rec = items.find(x => String(x.id) === String(id));
        return rec ? json(rec) : notFound();
      }
    }
    if (request.method === 'POST' && !id) {
      const payload = await request.json().catch(()=>null);
      if (!payload || typeof payload !== 'object') return badRequest('Invalid JSON');
      if(useSupa){
        const rec = await sCreate(env, col, { id: uid(), ...payload });
        return json(rec, { status:201 });
      }else{
        const items = await readCol(env, col);
        const rec = { id: uid(), ...payload };
        items.unshift(rec);
        await writeCol(env, col, items);
        return json(rec, { status:201 });
      }
    }
    if (request.method === 'PUT' && id) {
      const payload = await request.json().catch(()=>null);
      if (!payload || typeof payload !== 'object') return badRequest('Invalid JSON');
      if(useSupa){
        const rec = await sUpdate(env, col, id, payload);
        return rec ? json(rec) : notFound();
      }else{
        const items = await readCol(env, col);
        const i = items.findIndex(x => String(x.id) === String(id));
        if (i === -1) return notFound();
        items[i] = { ...items[i], ...payload, id: items[i].id };
        await writeCol(env, col, items);
        return json(items[i]);
      }
    }
    if (request.method === 'DELETE' && id) {
      if(useSupa){
        const ok = await sDelete(env, col, id);
        return ok ? new Response('', { status:204, headers: corsHeaders() }) : notFound();
      }else{
        const items = await readCol(env, col);
        const before = items.length;
        const next = items.filter(x => String(x.id) !== String(id));
        if (next.length === before) return notFound();
        await writeCol(env, col, next);
        return new Response('', { status:204, headers: corsHeaders() });
      }
    }
    return badRequest();
  } catch (e) {
    return json({ error:'Server error', detail: String(e) }, { status:500 });
  }
}
