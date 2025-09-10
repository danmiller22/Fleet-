// Seed Supabase tables from local JSON seed (server/db.js)
// Usage: SUPABASE_URL=... SUPABASE_KEY=... node tools/seed-supabase.js

const supa = require('../server/supabase');
const { ensureDB, loadDB } = require('../server/db');

async function seed(){
  if(!supa.isConfigured(process.env)){
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in env');
    process.exit(1);
  }
  ensureDB();
  const db = loadDB();
  const cols = ['trucks','trailers','repairs','expenses'];
  for(const col of cols){
    const existing = await supa.list(process.env, col).catch(()=>[]);
    if(existing.length>0){
      console.log(`[skip] ${col} already has ${existing.length} rows`);
      continue;
    }
    const arr = db[col] || [];
    console.log(`[seed] inserting ${arr.length} rows into ${col}...`);
    for(const row of arr){
      await supa.create(process.env, col, row);
    }
  }
  console.log('Done.');
}

seed();

