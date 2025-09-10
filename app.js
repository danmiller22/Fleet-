
import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';
import * as Recharts from 'https://esm.sh/recharts@2?bundle';

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip:ReTooltip, Legend, Area, AreaChart, PieChart, Pie, Cell } = Recharts;

/** Utilities **/
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).slice(2, 9);
const store = {
  get(k, fallback){ try{return JSON.parse(localStorage.getItem(k)||'null') ?? fallback;}catch{return fallback;} },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

// Dark mode
function computeInitialDark(lsValue, prefersDark){ if(lsValue==='true') return true; if(lsValue==='false') return false; return !!prefersDark; }
function useDarkMode(){
  const [dark, setDark] = useState(()=>{
    const ls = localStorage.getItem('ui.dark');
    const prefers = matchMedia('(prefers-color-scheme: dark)').matches;
    return computeInitialDark(ls, prefers);
  });
  useEffect(()=>{
    const cl = document.documentElement.classList;
    if(dark) cl.add('dark'); else cl.remove('dark');
    localStorage.setItem('ui.dark', String(dark));
    // Subtle Apple-like theme fade overlay
    try{
      const ov = document.createElement('div');
      ov.style.position='fixed'; ov.style.inset='0'; ov.style.zIndex='9999';
      ov.style.pointerEvents='none';
      ov.style.background = 'radial-gradient(1200px 800px at 20% -20%, rgba(255,255,255,.08), transparent 55%), var(--bg)';
      ov.style.opacity='0'; ov.style.transition='opacity 240ms var(--ease)';
      document.body.appendChild(ov);
      requestAnimationFrame(()=>{ ov.style.opacity='1'; setTimeout(()=>{ ov.style.opacity='0'; setTimeout(()=>ov.remove(), 240); }, 60); });
    }catch{}
  }, [dark]);
  return [dark, setDark];
}

// Toast
const toast = {
  show(msg){ const el = document.getElementById('toast'); if(!el) return; el.textContent = msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 1800); },
  success(msg){ this.show(msg); },
  error(msg){ this.show(msg); }
};

/** Icons (inline) **/
const Svg = ({className, children, viewBox='0 0 24 24'}) => <svg className={className} width="1em" height="1em" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const Icon = {
  Truck:(p)=> <Svg {...p}><path d="M3 13V7h10l4 4v6H3z"/><path d="M13 7v4h4"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></Svg>,
  Trailer:(p)=> <Svg {...p}><rect x="3" y="8" width="14" height="7" rx="1"/><circle cx="9" cy="17" r="2"/></Svg>,
  Clipboard:(p)=> <Svg {...p}><rect x="4" y="5" width="16" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 11h8M8 15h8"/></Svg>,
  Chart:(p)=> <Svg {...p}><path d="M3 3v18h18"/><rect x="6" y="10" width="3" height="7"/><rect x="11" y="6" width="3" height="11"/><rect x="16" y="12" width="3" height="5"/></Svg>,
  Dollar:(p)=> <Svg {...p}><path d="M12 1v22"/><path d="M17 5c0-1.657-2.239-3-5-3S7 3.343 7 5s2.239 3 5 3 5 1.343 5 3-2.239 3-5 3-5 1.343-5 3 2.239 3 5 3 5-1.343 5-3"/></Svg>,
  Wallet:(p)=> <Svg {...p}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="16" cy="12" r="1.5"/></Svg>,
  Sun:(p)=> <Svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></Svg>,
  Moon:(p)=> <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/></Svg>,
  Search:(p)=> <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Svg>,
  Plus:(p)=> <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>,
  X:(p)=> <Svg {...p}><path d="M18 6L6 18M6 6l12 12"/></Svg>,
  Upload:(p)=> <Svg {...p}><path d="M12 17V7"/><path d="M7 12l5-5 5 5"/><path d="M5 20h14"/></Svg>,
  Pencil:(p)=> <Svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></Svg>,
};

/** Primitive UI **/
function Button({ children, variant='default', size='md', className='', ...rest }){
  const cls = ['btn', variant==='primary'?'btn-primary':'', variant==='ghost'?'btn-ghost':'', size==='sm'?'btn-sm':'', className].join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}
const Input = (p) => <input {...p}/>;
const Textarea = (p) => <textarea rows={3} {...p}/>;
function Badge({ children, variant='default', className='' }){
  const cls = ['badge', variant==='destructive'?'badge-destructive':'', className].join(' ');
  return <span className={cls}>{children}</span>;
}
function Card({ children, className='' }){ return <div className={'panel '+className}>{children}</div>; }
function CardHeader({ children, className='' }){ return <div className={'mb-2 '+className}>{children}</div>; }
function CardContent({ children, className='' }){ return <div className={className}>{children}</div>; }
function CardTitle({ children, className='' }){ return <h3 className={className}>{children}</h3>; }
function Switch({checked, onChange}){
  return <label style={{display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer'}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{display:'none'}}/>
    <span style={{width:36,height:22,background:checked?'var(--brand)':'var(--bg-2)',border:'1px solid var(--border)',borderRadius:999,position:'relative',display:'inline-block',transition:'all var(--t) var(--ease)'}}>
      <i style={{position:'absolute',top:2,left:checked?18:2,width:18,height:18,background:'#fff',borderRadius:'50%',transition:'all var(--t) var(--ease)'}}/>
    </span>
  </label>
}

/** Local state hooks & seeds (ported from tms.jsx) **/
const STAGES = ['New','Diagnose','Estimate','Approval','Parts','Repair','QA','Closed'];
const STAGE_ALL = '__ALL__';
const SEED = {
  trucks: [
    { id: '3252', make: 'Freightliner', model: 'Cascadia', year: 2021, vin: '1FUJHHDR0MLMJ4879', status: 'Active', miles: 618230, pmInterval: 20000, pmDueAt: 618230, notes: 'Oil change due now' },
    { id: '5496', make: 'Volvo', model: 'VNL', year: 2024, vin: '4V4NC9EH0LN223912', status: 'Active', miles: 409659, pmInterval: 20000, pmDueAt: 409659, notes: 'Windshield replaced 2025-09-04' },
  ],
  trailers: [
    { id: 'XTRA-40123', type: 'Dry Van', owner: 'XTRA Lease', status: 'On Road', extId: 'SkyB-12345', notes: 'External tracked' },
    { id: 'UST-9001', type: 'Dry Van', owner: 'US TEAM', status: 'Yard', extId: '—', notes: 'Ready' },
  ],
  cases: [
    { id: uid(), assetType: 'truck', assetId: '3252', title: 'Coolant leak', priority: 'High', stage: 'Diagnose', createdAt: Date.now() - 86400000*2, cost: 0, assigned: 'Jack', timeline: [ { t: Date.now() - 86400000*2, note: 'Driver reports coolant on ground.' } ], invoices: [] },
    { id: uid(), assetType: 'trailer', assetId: 'XTRA-40123', title: 'ABS light ON', priority: 'Medium', stage: 'Parts', createdAt: Date.now() - 86400000*1, cost: 75, assigned: 'Aidar', timeline: [ { t: Date.now()- 86400000, note: 'Mobile tech scheduled.' } ], invoices: [] }
  ],
  ledger: [
    { id: uid(), type: 'expense', amount: 535, category: 'Tires', note: 'Steer tire fix — Houston, TX', ref: '2023/00' },
    { id: uid(), type: 'expense', amount: 325, category: 'Windshield', note: 'Windshield mobile — Wichita, KS', ref: '2025/09/04' },
    { id: uid(), type: 'income', amount: 4200, category: 'Load', note: 'Load #AB-778, Jack', ref: '2025/09/03' },
  ]
};
function useSeededState(key, initial) {
  const [state, setState] = useState(() => store.get(key, null) ?? (initial ?? SEED[key]));
  useEffect(()=>{ store.set(key, state); }, [key, state]);
  return [state, setState];
}

// API client + hook (sync with backend; fallback to local storage)
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || '';
const COL_MAP = { ledger:'expenses', trucks:'trucks', trailers:'trailers', cases:'cases' };
const apiClient = {
  async list(col){ const r = await fetch(`${API_BASE}/api/${col}`); if(!r.ok) throw new Error('list'); return r.json(); },
  async create(col, data){ const r = await fetch(`${API_BASE}/api/${col}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); if(!r.ok) throw new Error('create'); return r.json(); },
  async update(col, id, data){ const r = await fetch(`${API_BASE}/api/${col}/${encodeURIComponent(id)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); if(!r.ok) throw new Error('update'); return r.json(); },
  async remove(col, id){ const r = await fetch(`${API_BASE}/api/${col}/${encodeURIComponent(id)}`, { method:'DELETE' }); if(!r.ok && r.status!==204) throw new Error('delete'); return true; },
};

function useCollectionApi(key, seed){
  const col = COL_MAP[key] || key;
  const [items, setItems] = useState(()=> store.get(key, seed ?? []));
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try{
        const data = await apiClient.list(col);
        setItems(data || []);
        store.set(key, data || []);
        setOnline(true);
      }catch{
        setItems(store.get(key, seed ?? []));
        setOnline(false);
      }finally{ setReady(true); }
    })();
  }, [col, key]);

  async function add(data){
    try{
      const rec = await apiClient.create(col, data);
      setItems(prev => [rec, ...prev]); store.set(key, [rec, ...items]); setOnline(true); toast.success('Saved');
      return rec;
    }catch{
      const rec = { id: uid(), ...data };
      setItems(prev => [rec, ...prev]); store.set(key, [rec, ...items]); setOnline(false); toast.error('Saved locally');
      return rec;
    }
  }
  async function update(id, patch){
    try{
      const rec = await apiClient.update(col, id, patch);
      setItems(prev => prev.map(x => x.id===id ? { ...x, ...rec } : x)); store.set(key, (store.get(key, items)||[]).map(x => x.id===id ? { ...x, ...rec } : x)); setOnline(true);
      return rec;
    }catch{
      setItems(prev => prev.map(x => x.id===id ? { ...x, ...patch } : x)); store.set(key, (store.get(key, items)||[]).map(x => x.id===id ? { ...x, ...patch } : x)); setOnline(false); toast.error('Updated locally');
      return { id, ...patch };
    }
  }
  async function remove(id){
    try{ await apiClient.remove(col, id); setItems(prev => prev.filter(x => x.id!==id)); store.set(key, (store.get(key, items)||[]).filter(x => x.id!==id)); setOnline(true); }
    catch{ setItems(prev => prev.filter(x => x.id!==id)); store.set(key, (store.get(key, items)||[]).filter(x => x.id!==id)); setOnline(false); toast.error('Deleted locally'); }
  }

  return { items, ready, online, add, update, remove, setItems };
}

function Kbd({children}){ return <kbd className="kbd">{children}</kbd>; }

/** Shared blocks **/
function Stat({label, value, icon:IconCmp}){
  return (
    <div className="panel">
      <div className="p-2" style={{display:'flex',alignItems:'center',gap:12}}>
        <div className="rounded-2xl p-2" style={{background:'var(--bg-2)', border:'1px solid var(--border)'}}><IconCmp className="icon" /></div>
        <div>
          <div style={{fontSize:12, color:'var(--muted)'}}>{label}</div>
          <div style={{fontSize:18, fontWeight:700}}>{value}</div>
        </div>
      </div>
    </div>
  );
}
function Row({children}){ return <div className="grid">{children}</div>; }

function BrandMark({src='logo.png'}){
  const [err, setErr] = useState(false);
  if(err) return <div style={{width:30,height:30,borderRadius:12,display:'grid',placeItems:'center',background:'black',color:'white',fontWeight:800}}>B</div>;
  return <img src={src} alt="Logo" onError={()=>setErr(true)} />;
}

/** Sections (ported from tms.jsx with minor native controls) **/
function Dashboard({ trucks, trailers, cases, ledger }){
  const exp = useMemo(() => ledger.filter(l=>l.type==='expense').reduce((a,b)=>a+b.amount,0), [ledger]);
  const inc = useMemo(() => ledger.filter(l=>l.type==='income').reduce((a,b)=>a+b.amount,0), [ledger]);
  const openCases = cases.filter(c=>c.stage!=='Closed').length;

  const chartData = useMemo(()=>{
    const days = [...Array(10)].map((_,i)=>{
      const day = new Date(Date.now() - (9-i)*86400000);
      const key = day.toISOString().slice(5,10);
      const e = ledger.filter(l=>l.type==='expense' && Math.random()>.5).reduce((a,b)=>a+b.amount,0);
      const r = ledger.filter(l=>l.type==='income' && Math.random()>.5).reduce((a,b)=>a+b.amount,0);
      return { day: key, Expenses: e, Revenue: r };
    });
    return days;
  },[ledger]);

  return (
    <div className="space-y">
      <Row>
        <div className="span-4"><Stat label="Active trucks" value={trucks.length} icon={Icon.Truck}/></div>
        <div className="span-4"><Stat label="Trailers" value={trailers.length} icon={Icon.Trailer}/></div>
        <div className="span-4"><Stat label="Open cases" value={openCases} icon={Icon.Clipboard}/></div>
        <div className="span-4"><Stat label="Revenue (est)" value={fmt.format(inc)} icon={Icon.Dollar}/></div>
        <div className="span-4"><Stat label="Expenses" value={fmt.format(exp)} icon={Icon.Wallet}/></div>
        <div className="span-4"><Stat label="Net" value={fmt.format(inc-exp)} icon={Icon.Chart}/></div>
      </Row>

      <div className="panel span-12">
        <h3 className="mb-2" style={{display:'flex',alignItems:'center',gap:8}}><Icon.Chart/> 10‑day Finance Trend</h3>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ReTooltip />
              <Legend />
              <Area type="monotone" dataKey="Revenue" strokeWidth={2} stroke="currentColor" fill="url(#g1)" />
              <Area type="monotone" dataKey="Expenses" strokeWidth={2} stroke="currentColor" fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Trucks({ trucks, setTrucks }){
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = trucks.filter(t => [t.id,t.vin,t.make,t.model].join(' ').toLowerCase().includes(q.toLowerCase()));

  function addTruck(e){
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const t = {
      id: String(f.get('id')).trim() || uid(),
      make: f.get('make'), model: f.get('model'), year: Number(f.get('year')),
      vin: f.get('vin'), status: f.get('status'), miles: Number(f.get('miles')),
      pmInterval: Number(f.get('pmInterval')), pmDueAt: Number(f.get('pmDueAt')), notes: f.get('notes')
    };
    setTrucks(prev => [...prev, t]); try{ fetch('/api/trucks',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(t)}); }catch{ }
    e.currentTarget.reset();
    setOpen(false); toast.success('Truck added');
  }
  const remove = (id) => { setTrucks(prev => prev.filter(t=>t.id!==id)); try{ fetch('/api/trucks/'+encodeURIComponent(id), { method:'DELETE' }); }catch{ } };

  return (
    <div className="space-y">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12, marginBottom:8}}>
        <h2 style={{fontSize:18,fontWeight:700}}>Trucks</h2>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="search" style={{minWidth:280}}>
            <Icon.Search className="icon"/>
            <input placeholder="Search ID / VIN / make" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <Button className="btn btn-primary" onClick={()=>setOpen(true)}><Icon.Plus/> Add</Button>
        </div>
      </div>

      {open && (
        <div className="panel" style="position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:50;">
          <div className="panel" style="max-width:720px; width:92%;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <h3>Add truck</h3>
              <button class="btn btn-ghost" onclick="this.closest('[style*=inset]').remove()"><span>×</span></button>
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        {filtered.map(t => (
          <div key={t.id} className="panel span-4">
            <div className="mb-2">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <h3 style={{fontSize:15}}># {t.id} • {t.make} {t.model}</h3>
                <Badge> {t.status} </Badge>
              </div>
              <div style={{fontSize:12,color:'var(--muted)'}}>VIN {t.vin}</div>
            </div>
            <div className="space-y">
              <div className="text-sm">Odo: <b>{t.miles.toLocaleString()}</b> mi</div>
              <div className="text-sm">PM interval: <b>{t.pmInterval.toLocaleString()}</b> mi</div>
              <div className="text-sm">PM due @ <b>{t.pmDueAt.toLocaleString()}</b> mi</div>
              <p style={{color:'var(--muted)'}}>{t.notes}</p>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <Button className="btn">Edit</Button>
                <Button className="btn badge-destructive" onClick={()=>remove(t.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trailers({ trailers, setTrailers }){
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = trailers.filter(t => [t.id,t.type,t.owner,t.extId].join(' ').toLowerCase().includes(q.toLowerCase()));

  function addTrailer(e){
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const t = { id: f.get('id'), type: f.get('type'), owner: f.get('owner'), status: f.get('status'), extId: f.get('extId'), notes: f.get('notes') };
    setTrailers(prev => [...prev, t]); try{ fetch('/api/trailers',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(t)}); }catch{ }
    e.currentTarget.reset(); setOpen(false); toast.success('Trailer added');
  }

  return (
    <div className="space-y">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12, marginBottom:8}}>
        <h2 style={{fontSize:18,fontWeight:700}}>Trailers</h2>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="search" style={{minWidth:280}}>
            <Icon.Search className="icon"/>
            <input placeholder="Search ID / owner / extId" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <Button className="btn btn-primary" onClick={()=>setOpen(true)}><Icon.Plus/> Add</Button>
        </div>
      </div>

      <div className="grid">
        {filtered.map(t => (
          <div key={t.id} className="panel span-4">
            <div className="mb-2">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <h3 style={{fontSize:15}}>{t.id} • {t.type}</h3>
                <Badge>{t.status}</Badge>
              </div>
              <div style={{fontSize:12,color:'var(--muted)'}}>Owner {t.owner} • Ext {t.extId || '—'}</div>
            </div>
            <div><p style={{color:'var(--muted)'}}>{t.notes}</p></div>
          </div>
        ))}
      </div>

      {open && (
        <div className="modal">
          <div className="panel" style="max-width:720px; width:92%;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <h3>Add trailer</h3>
              <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <form class="grid" onsubmit="return false;">
              <!-- form omitted in this static modal; actual app.js below implements real modal via React -->
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Cases({ cases, setCases }){
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState(STAGE_ALL);

  const filtered = cases.filter(c => {
    const hay = [c.assetId,c.title,c.priority,c.stage,c.assigned].join(' ').toLowerCase();
    const matchQ = hay.includes(q.toLowerCase());
    const matchS = stageFilter === STAGE_ALL ? true : c.stage === stageFilter;
    return matchQ && matchS;
  });

  function addCase(e){
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const c = {
      id: uid(),
      assetType: f.get('assetType'), assetId: f.get('assetId'),
      title: f.get('title'), priority: f.get('priority'), stage: 'New',
      createdAt: Date.now(), cost: 0, assigned: f.get('assigned'),
      timeline: [{ t: Date.now(), note: 'Case created' }], invoices: []
    };
    setCases(prev => [c, ...prev]); try{ fetch('/api/cases',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(c)}); }catch{ } e.currentTarget.reset(); toast.success('Case created');
  }

  function pushStage(id){
    setCases(prev => prev.map(c => {
      if(c.id!==id) return c;
      const idx = STAGES.indexOf(c.stage); const next = Math.min(idx+1, STAGES.length-1);
      const nc = { ...c, stage: STAGES[next], timeline: [...c.timeline, { t: Date.now(), note: `Moved → ${STAGES[next]}` }] };
      if (STAGES[next]==='Closed') nc.timeline.push({ t: Date.now(), note: 'Case closed' });
      return nc;
    }));
  }

  return (
    <div className="space-y">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12, marginBottom:8}}>
        <h2 style={{fontSize:18,fontWeight:700}}>Cases</h2>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="search" style={{minWidth:280}}>
            <Icon.Search className="icon"/>
            <input placeholder="Search case / asset / assignee" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <select value={stageFilter} onChange={(e)=>setStageFilter(e.target.value)}>
            <option value={STAGE_ALL}>All</option>
            {STAGES.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid">
        {filtered.map(c => (
          <div key={c.id} className="panel span-6">
            <div className="mb-2">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <h3 style={{fontSize:15}}>{c.title} • <span style={{color:'var(--muted)'}}>{c.assetId}</span></h3>
                <Badge className={c.priority==='High'||c.priority==='Critical'?'badge-destructive':''}>{c.priority}</Badge>
              </div>
              <div style={{fontSize:12,color:'var(--muted)'}}>Stage: {c.stage} • Opened {new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="space-y">
              <div className="text-xs" style={{color:'var(--muted)'}}>Timeline</div>
              <div style={{maxHeight:160, overflow:'auto', paddingRight:6}}>
                {c.timeline.map((t,i)=>(
                  <div key={i} style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
                    <span style={{width:6,height:6,borderRadius:999,background:'var(--muted)'}}/>
                    <span>{t.note}</span>
                    <span style={{fontSize:10,color:'var(--muted)'}}>{new Date(t.t).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input placeholder="Add note…" onKeyDown={(e)=>{
                  if(e.key==='Enter'){ const v=(e.target.value||'').trim(); if(v){ setCases(prev => prev.map(x => x.id===c.id ? { ...x, timeline:[...x.timeline, { t: Date.now(), note: v }] } : x)); e.target.value=''; } }
                }}/>
                <Button className="btn" onClick={()=>pushStage(c.id)}>Next →</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel span-12">
        <h3>Open a case</h3>
        <form className="grid" onSubmit={addCase} style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12}}>
          <input name="assetType" placeholder="Asset type (truck/trailer)" defaultValue="truck"/>
          <input name="assetId" placeholder="Unit ID (e.g., 3252 / XTRA-40123)"/>
          <input name="title" placeholder="Issue title (e.g., Coolant leak)" className="span-12"/>
          <input name="priority" placeholder="Priority (Low/Medium/High/Critical)" defaultValue="Medium"/>
          <input name="assigned" placeholder="Assignee (e.g., Jack)"/>
          <div className="span-12" style={{display:'flex',justifyContent:'flex-end'}}><Button className="btn btn-primary" type="submit">Create</Button></div>
        </form>
      </div>
    </div>
  );
}

function Finance({ ledger, setLedger }){
  const [type, setType] = useState('expense');
  const [q, setQ] = useState('');
  const filtered = ledger.filter(l => [l.category,l.note,l.ref,l.type].join(' ').toLowerCase().includes(q.toLowerCase()));
  const totals = useMemo(()=>({
    expense: ledger.filter(l=>l.type==='expense').reduce((a,b)=>a+b.amount,0),
    income: ledger.filter(l=>l.type==='income').reduce((a,b)=>a+b.amount,0),
  }),[ledger]);

  function addItem(e){
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const it = { id: uid(), type, amount: Number(f.get('amount')), category: f.get('category'), note: f.get('note'), ref: f.get('ref') };
    setLedger(prev => [it, ...prev]); try{ fetch('/api/expenses',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(it)}); }catch{} e.currentTarget.reset();
  }

  return (
    <div className="space-y">
      <Row>
        <div className="span-4"><Stat label="Revenue" value={fmt.format(totals.income)} icon={Icon.Dollar}/></div>
        <div className="span-4"><Stat label="Expenses" value={fmt.format(totals.expense)} icon={Icon.Wallet}/></div>
        <div className="span-4"><Stat label="Net" value={fmt.format(totals.income - totals.expense)} icon={Icon.Chart}/></div>
      </Row>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12, margin:'8px 0'}}>
        <h2 style={{fontSize:18,fontWeight:700}}>Ledger</h2>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="search" style={{minWidth:280}}>
            <Icon.Search className="icon"/>
            <input placeholder="Search notes / ref / category" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <select value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div style="overflow:auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Type</th><th>Amount</th><th>Category</th><th>Note</th><th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td><Badge className={row.type==='expense'?'badge-destructive':''}>{row.type}</Badge></td>
                  <td style={{fontWeight:600}}>{fmt.format(row.amount)}</td>
                  <td>{row.category}</td>
                  <td style={{color:'var(--muted)'}}>{row.note}</td>
                  <td style={{color:'var(--muted)'}}>{row.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Add {type}</h3>
        <form className="grid" onSubmit={addItem} style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12}}>
          <input name="amount" type="number" step="0.01" placeholder="Amount" required/>
          <input name="category" placeholder="Category (e.g., Tires)" required/>
          <input name="ref" placeholder="Ref (load # / invoice)"/>
          <div className="span-12"><textarea name="note" placeholder="Note"></textarea></div>
          <div className="span-12" style={{display:'flex',justifyContent:'flex-end'}}><Button className="btn btn-primary" type="submit">Save</Button></div>
        </form>
      </div>
    </div>
  );
}

function Analytics({ ledger, cases }){
  const caseByStage = useMemo(()=>{
    const mp = Object.fromEntries(STAGES.map(s=>[s,0]));
    cases.forEach(c => { mp[c.stage] = (mp[c.stage]||0)+1; });
    return Object.entries(mp).map(([name, value])=>({ name, value }));
  },[cases]);

  const finance = useMemo(()=>{
    const days = [...Array(14)].map((_,i)=>{
      const day = new Date(Date.now() - (13-i)*86400000).toISOString().slice(5,10);
      const exp = ledger.filter(l=>l.type==='expense' && Math.random()>.6).reduce((a,b)=>a+b.amount,0);
      const inc = ledger.filter(l=>l.type==='income' && Math.random()>.6).reduce((a,b)=>a+b.amount,0);
      return { day, Expenses: exp, Revenue: inc };
    });
    return days;
  },[ledger]);

  return (
    <div className="space-y">
      <div className="grid">
        <div className="panel span-6">
          <h3>Cases by stage</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={caseByStage} dataKey="value" nameKey="name" outerRadius={100}>
                  {caseByStage.map((e,i)=> <Cell key={i} />)}
                </Pie>
                <ReTooltip/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel span-6">
          <h3>Revenue vs. Expenses (14d)</h3>
          <div style={{height:260}}>
            <ResponsiveContainer>
              <LineChart data={finance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day"/>
                <YAxis/>
                <ReTooltip/>
                <Legend/>
                <Line type="monotone" dataKey="Revenue" strokeWidth={2}/>
                <Line type="monotone" dataKey="Expenses" strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel(){
  const [dark, setDark] = useDarkMode();
  return (
    <div className="space-y">
      <div className="panel">
        <h3>Appearance</h3>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between', marginTop:8}}>
          <div>
            <div style={{fontWeight:600}}>Dark mode</div>
            <div style={{fontSize:13, color:'var(--muted)'}}>Apple‑style subtle dark theme</div>
          </div>
          <Switch checked={dark} onChange={setDark} />
        </div>
      </div>
      <div className="panel">
        <h3>Data export (free)</h3>
        <p style={{fontSize:13, color:'var(--muted)'}}>Local first: all data stored in browser (localStorage). Export/import JSON for backups.</p>
        <div style={{display:'flex',gap:8}}>
          <Button onClick={()=>{
            const dump = ['trucks','trailers','cases','ledger'].reduce((acc,k)=> (acc[k]=store.get(k,[]), acc), {});
            const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
            const url = URL.createObjectURL(blob); const a=document.createElement('a');
            a.href=url; a.download='tms-export.json'; a.click(); URL.revokeObjectURL(url);
          }}>Export JSON</Button>
          <label className="btn" style={{cursor:'pointer'}}>
            <Icon.Upload/> Import JSON
            <input type="file" accept="application/json" style="display:none" onchange=""/>
          </label>
        </div>
      </div>
    </div>
  );
}

/** App shell **/
const NAV = [
  { key:'dashboard', label:'Dashboard', icon: Icon.Chart },
  { key:'trucks', label:'Trucks', icon: Icon.Truck },
  { key:'trailers', label:'Trailers', icon: Icon.Trailer },
  { key:'cases', label:'Cases', icon: Icon.Clipboard },
  { key:'finance', label:'Finance', icon: Icon.Wallet },
  { key:'analytics', label:'Analytics', icon: Icon.Chart },
  { key:'settings', label:'Settings', icon: Icon.Chart },
];

function App(){
  const [tab, setTab] = useState('dashboard');
  const [trucks, setTrucks] = useSeededState('trucks', SEED.trucks);
  const [trailers, setTrailers] = useSeededState('trailers', SEED.trailers);
  const [cases, setCases] = useSeededState('cases', SEED.cases);
  const [ledger, setLedger] = useSeededState('ledger', SEED.ledger);
  const [dark, setDark] = useDarkMode();

  // Initial sync from backend when available
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/trucks'); if(r.ok){ const data=await r.json(); Array.isArray(data)&& setTrucks(data); } }catch{} })(); },[]);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/trailers'); if(r.ok){ const data=await r.json(); Array.isArray(data)&& setTrailers(data); } }catch{} })(); },[]);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/cases'); if(r.ok){ const data=await r.json(); Array.isArray(data)&& setCases(data); } }catch{} })(); },[]);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/expenses'); if(r.ok){ const data=await r.json(); Array.isArray(data)&& setLedger(data); } }catch{} })(); },[]);

  useEffect(()=>{
    const onK = (e) => { if(e.ctrlKey && (e.key||'').toLowerCase()==='k'){ e.preventDefault(); const i = document.getElementById('global-search'); i && i.focus && i.focus(); } };
    window.addEventListener('keydown', onK); return ()=>window.removeEventListener('keydown', onK);
  },[]);

  useEffect(()=>{
    const main = document.getElementById('swap'); if(main){ document.dispatchEvent(new CustomEvent('ui:swap', { detail: main })); }
  }, [tab]);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <BrandMark/>
          <div className="title">TranGo — TMS</div>
          <span className="badge" style={{marginLeft:8}}>Free</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="search">
            <Icon.Search className="icon"/>
            <input id="global-search" placeholder="Quick search (Ctrl+K)" />
          </div>
          <Button className="btn btn-ghost" onClick={()=>setDark(v=>!v)} aria-label="Toggle dark mode">
            {dark ? <Icon.Sun/> : <Icon.Moon/>}
          </Button>
          <Button className="btn"> <Icon.Upload/> Import </Button>
        </div>
      </div>

      <div className="container">
        <aside className="sidebar">
          {NAV.map(n => (
            <button key={n.key} className={'nav-btn '+(tab===n.key?'active':'')} onClick={()=>setTab(n.key)}>
              <n.icon className="icon"/> {n.label}
            </button>
          ))}
          <div className="tips">
            <div style={{fontSize:12}}>Tips</div>
            <ul style={{fontSize:12, marginTop:6, paddingLeft:16}}>
              <li>Use Ctrl+K to quick‑search</li>
              <li>Export JSON in Settings</li>
              <li>Attach invoices to cases</li>
            </ul>
          </div>
        </aside>

        <main id="swap">
          {tab==='dashboard' && <Dashboard trucks={trucks} trailers={trailers} cases={cases} ledger={ledger}/>}
          {tab==='trucks' && <Trucks trucks={trucks} setTrucks={setTrucks}/>}
          {tab==='trailers' && <Trailers trailers={trailers} setTrailers={setTrailers}/>}
          {tab==='cases' && <Cases cases={cases} setCases={setCases}/>}
          {tab==='finance' && <Finance ledger={ledger} setLedger={setLedger}/>}
          {tab==='analytics' && <Analytics ledger={ledger} cases={cases}/>}
          {tab==='settings' && <SettingsPanel/>}
        </main>
      </div>

      <footer className="footer">
        <div className="italic">" It's our duty to lead people to the light"</div>
        <div className="mt-1">by Dan Miller</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App/>);






