export const collections = ['trucks','trailers','repairs','expenses','cases'];

export function json(data, init={}){
  return new Response(JSON.stringify(data), { headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...corsHeaders() }, ...init });
}

export function corsHeaders(){
  return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' };
}

export function notFound(){ return json({ error:'Not found' }, { status:404 }); }
export function badRequest(msg='Bad request'){ return json({ error: msg }, { status:400 }); }

export function uid(){ return Math.random().toString(36).slice(2,9); }

export function seedData(){
  return {
    trucks: [
      { id: uid(), plate: 'A123BC', make: 'Volvo',  model: 'FH16', year: 2019, mileage: 325000, status: 'Active' },
      { id: uid(), plate: 'K777KK', make: 'Scania', model: 'R500', year: 2021, mileage: 184200, status: 'Service' },
      { id: uid(), plate: 'M456OP', make: 'MAN',    model: 'TGX',  year: 2018, mileage: 560300, status: 'Repair' },
    ],
    trailers: [
      { id: uid(), code: 'TR-018', type: 'Curtainsider', capacity: 22, status: 'Active' },
      { id: uid(), code: 'TR-042', type: 'Refrigerated', capacity: 24, status: 'Service' },
      { id: uid(), code: 'TR-055', type: 'Flatbed',      capacity: 28, status: 'Active' },
    ],
    repairs: [
      { id: uid(), assetType: 'Truck',   assetId: 'A123BC', date: '2025-03-01', description: 'Oil change + front pads', cost: 230.50, status: 'Completed' },
      { id: uid(), assetType: 'Trailer', assetId: 'TR-042', date: '2025-03-11', description: 'Light wiring repair',     cost: 120.00, status: 'In progress' },
    ],
    expenses: [
      { id: uid(), category: 'Fuel',       amount: 320.45, date: '2025-03-13', notes: 'Card ••••4821, Driver: DO4' },
      { id: uid(), category: 'Tolls/Fees', amount:  45.70, date: '2025-03-14', notes: 'Toll #34' },
      { id: uid(), category: 'Parking',    amount: 210.00, date: '2025-03-10', notes: 'Night parking yard' },
    ],
    cases: [
      { id: uid(), assetType: 'Truck',   assetId: 'A123BC',   title: 'Coolant leak', priority: 'High',   stage: 'Diagnose', createdAt: Date.now() - 86400000*2, cost: 0,  assigned: 'Jack',  timeline: [ { t: Date.now() - 86400000*2, note: 'Driver reports coolant on ground.' } ], invoices: [] },
      { id: uid(), assetType: 'Trailer', assetId: 'TR-042',   title: 'ABS light ON', priority: 'Medium', stage: 'Parts',    createdAt: Date.now() - 86400000*1, cost: 75, assigned: 'Aidar', timeline: [ { t: Date.now() - 86400000,   note: 'Mobile tech scheduled.' } ], invoices: [] }
    ],
  };
}

function kv(env){
  return env.DB || env.MY_KV || env.MYKV || env.KV || env.STORE;
}

export async function ensureSeed(env){
  const store = kv(env);
  if(!store) throw new Error('KV binding not found. Bind as DB or MY_KV.');
  const flag = await store.get('seeded');
  if(flag) return;
  const data = seedData();
  await Promise.all(collections.map(col => store.put(col, JSON.stringify(data[col]))));
  await store.put('seeded', '1');
}

export async function readCol(env, col){
  const store = kv(env);
  if(!store) throw new Error('KV binding not found. Bind as DB or MY_KV.');
  const s = await store.get(col);
  return s ? JSON.parse(s) : [];
}

export async function writeCol(env, col, arr){
  const store = kv(env);
  if(!store) throw new Error('KV binding not found. Bind as DB or MY_KV.');
  await store.put(col, JSON.stringify(arr));
}
