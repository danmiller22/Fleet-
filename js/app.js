/* TMS Apple‑style Demo (English) */
(() => {
  const STORAGE_KEY = 'tms-apple-demo-v1';

  // Labels and statuses
  const TABS = { dashboard:'Dashboard', trucks: 'Trucks', trailers: 'Trailers', repairs: 'Repairs', expenses: 'Expenses' };
  const STATUS = { ACTIVE: 'Active', SERVICE: 'Service', REPAIR: 'Repair' };
  const REPAIR_STATUS = { IN_PROGRESS: 'In progress', DONE: 'Completed' };

  const initialData = {
    trucks: [
      { id: uid(), plate: 'A123BC', make: 'Volvo',  model: 'FH16', year: 2019, mileage: 325000, status: STATUS.ACTIVE },
      { id: uid(), plate: 'K777KK', make: 'Scania', model: 'R500', year: 2021, mileage: 184200, status: STATUS.SERVICE },
      { id: uid(), plate: 'M456OP', make: 'MAN',    model: 'TGX',  year: 2018, mileage: 560300, status: STATUS.REPAIR }
    ],
    trailers: [
      { id: uid(), code: 'TR-018', type: 'Curtainsider', capacity: 22, status: STATUS.ACTIVE },
      { id: uid(), code: 'TR-042', type: 'Refrigerated', capacity: 24, status: STATUS.SERVICE },
      { id: uid(), code: 'TR-055', type: 'Flatbed',      capacity: 28, status: STATUS.ACTIVE }
    ],
    repairs: [
      { id: uid(), assetType: 'Truck',   assetId: 'A123BC', date: '2025-03-01', description: 'Oil change + front pads', cost: 230.50, status: REPAIR_STATUS.DONE },
      { id: uid(), assetType: 'Trailer', assetId: 'TR-042', date: '2025-03-11', description: 'Light wiring repair',     cost: 120.00, status: REPAIR_STATUS.IN_PROGRESS }
    ],
    expenses: [
      { id: uid(), category: 'Fuel',       amount: 320.45, date: '2025-03-13', notes: 'Card ••••4821, Driver: DO4' },
      { id: uid(), category: 'Tolls/Fees', amount:  45.70, date: '2025-03-14', notes: 'Toll #34' },
      { id: uid(), category: 'Parking',    amount: 210.00, date: '2025-03-10', notes: 'Night parking yard' }
    ]
  };

  /* ---------- State ---------- */
  let data = load();
  const state = {
    tab: 'dashboard',
    sort: { key: null, dir: 1 },
    filter: '',
    scope: 'all',
  };

  // API mode detection (Cloudflare Pages: same-origin /api; local dev: http://localhost:3000/api)
  let useApi = false;
  const API_BASE = (window.API_BASE)
    ? window.API_BASE.replace(/\/$/, '')
    : ((location.hostname.endsWith('.pages.dev') || location.hostname.endsWith('.workers.dev'))
        ? '/api'
        : (location.port === '5173' ? 'http://localhost:3000/api' : '/api'));

  /* ---------- Elements ---------- */
  const nav = qs('#nav');
  const pageTitle = qs('#pageTitle');
  const pageCount = qs('#pageCount');
  const grid = qs('#grid');
  const filterInput = qs('#tableFilter');
  const globalSearch = qs('#globalSearch');
  const exportBtn = qs('#exportBtn');
  const createBtn = qs('#createBtn');
  const kpiTotal = qs('#kpiTotal');
  const kpiRepairing = qs('#kpiRepairing');
  const kpiMonthCost = qs('#kpiMonthCost');
  const kpiAvgRepair = qs('#kpiAvgRepair');
  const palette = qs('#palette');
  const paletteInput = qs('#paletteInput');
  const paletteList = qs('#paletteList');
  const themeToggle = qs('#themeToggle');
  const brandCard = qs('#brandCard');
  const connBadge = qs('#connBadge');

  /* ---------- Helpers ---------- */
  function uid(){ return Math.random().toString(36).slice(2,9); }
  function qs(s, root=document){ return root.querySelector(s); }
  function qsa(s, root=document){ return [...root.querySelectorAll(s)]; }
  function number(n){ return new Intl.NumberFormat('en-US').format(n); }
  function money(n){ return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(n); }
  function html(str){ const t=document.createElement('template'); t.innerHTML=str.trim(); return t.content.firstElementChild; }
  function toast(msg){ const t=qs('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2300); }
  function setConn(on){ if(!connBadge) return; connBadge.textContent = on? 'Online' : 'Offline'; connBadge.classList.toggle('online', !!on); }
  function clone(obj){
    try {
      return (typeof structuredClone === 'function') ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
    } catch {
      return JSON.parse(JSON.stringify(obj));
    }
  }
  function load(){
    try{
      const s = localStorage.getItem(STORAGE_KEY);
      if(!s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData)); return clone(initialData); }
      return JSON.parse(s);
    }catch(e){ console.warn('storage error', e); return clone(initialData); }
  }
  function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function esc(v){ return v==null? '' : String(v).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[s]); }

  // ---- API client (optional) ----
  async function apiList(col){ const r = await fetch(`${API_BASE}/${col}`); if(!r.ok) throw new Error(`GET ${col} ${r.status}`); return r.json(); }
  async function apiCreate(col, payload){ const r = await fetch(`${API_BASE}/${col}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); if(!r.ok) throw new Error(`POST ${col} ${r.status}`); return r.json(); }
  async function apiUpdate(col, id, payload){ const r = await fetch(`${API_BASE}/${col}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); if(!r.ok) throw new Error(`PUT ${col}/${id} ${r.status}`); return r.json(); }
  async function apiDelete(col, id){ const r = await fetch(`${API_BASE}/${col}/${id}`, { method:'DELETE' }); if(!(r.ok || r.status===204)) throw new Error(`DELETE ${col}/${id} ${r.status}`); }

  /* ---------- Rendering ---------- */
  function applyScope(items){
    if(state.tab === 'trucks'){
      if(state.scope==='active') return items.filter(v=> v.status === STATUS.ACTIVE);
      if(state.scope==='service') return items.filter(v=> v.status !== STATUS.ACTIVE);
    }
    if(state.tab === 'trailers'){
      if(state.scope==='active') return items.filter(v=> v.status === STATUS.ACTIVE);
      if(state.scope==='service') return items.filter(v=> v.status !== STATUS.ACTIVE);
    }
    return items;
  }
  function applyFilter(items){
    const q = state.filter.toLowerCase().trim();
    if(!q) return items;
    return items.filter(it => JSON.stringify(it).toLowerCase().includes(q));
  }
  function sortBy(items){
    const { key, dir } = state.sort;
    if(!key) return items;
    return items.slice().sort((a,b)=>{
      const av=a[key], bv=b[key];
      if(typeof av==='number' && typeof bv==='number') return (av-bv)*dir;
      return (''+av).localeCompare(''+bv)*dir;
    });
  }

  function statusBadge(v){
    let t='err';
    if(v===STATUS.ACTIVE || v===REPAIR_STATUS.DONE) t='ok';
    else if(v===STATUS.SERVICE || v===REPAIR_STATUS.IN_PROGRESS) t='warn';
    return `<span class="badge ${t}">${esc(v)}</span>`;
  }

  function columnsFor(tab){
    switch(tab){
      case 'trucks': return [
        { key:'plate',   label:'Plate' },
        { key:'make',    label:'Make' },
        { key:'model',   label:'Model' },
        { key:'year',    label:'Year' },
        { key:'mileage', label:'Mileage, km', format: v=> number(v) },
        { key:'status',  label:'Status', format: statusBadge },
        { key:'actions', label:'', isActions:true },
      ];
      case 'trailers': return [
        { key:'code',     label:'Code' },
        { key:'type',     label:'Type' },
        { key:'capacity', label:'Capacity, t', format: v=> number(v) },
        { key:'status',   label:'Status', format: statusBadge },
        { key:'actions',  label:'', isActions:true },
      ];
      case 'repairs': return [
        { key:'date',       label:'Date' },
        { key:'assetType',  label:'Asset type' },
        { key:'assetId',    label:'Asset ID' },
        { key:'description',label:'Description' },
        { key:'cost',       label:'Cost', format: v=> money(v) },
        { key:'status',     label:'Status', format: statusBadge },
        { key:'actions',    label:'', isActions:true },
      ];
      case 'expenses': return [
        { key:'date',     label:'Date' },
        { key:'category', label:'Category' },
        { key:'amount',   label:'Amount', format: v=> money(v) },
        { key:'notes',    label:'Notes' },
        { key:'actions',  label:'', isActions:true },
      ];
    }
  }

  function render(){
    const tab = state.tab;
    pageTitle.textContent = TABS[tab];
    qsa('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));

    // KPI
    updateKpi();

    const chartsRow = qs('#chartsRow');
    const panel = qs('#panel');

    if(tab === 'dashboard'){
      // Show charts, hide table
      chartsRow?.classList.remove('hidden');
      panel?.classList.add('hidden');
      pageCount.textContent = `• ${data.trucks.length} trucks • ${data.trailers.length} trailers`;
      grid.innerHTML = '';
      pageTransition();
      drawCharts();
      return;
    } else {
      chartsRow?.classList.add('hidden');
      panel?.classList.remove('hidden');
    }

    const rows = sortBy(applyFilter(applyScope(data[tab])));
    pageCount.textContent = `• ${rows.length} items`;

    // Build grid
    const cols = columnsFor(tab);
    const thead = html('<thead><tr></tr></thead>');
    cols.forEach(c => {
      const th = html(`<th>${c.label}${!c.isActions?'<span class="sort">⇅</span>':''}</th>`);
      if(!c.isActions){
        th.addEventListener('click', () => {
          if(state.sort.key === c.key){ state.sort.dir *= -1; }
          else { state.sort.key = c.key; state.sort.dir = 1; }
          render();
        });
      }
      thead.querySelector('tr').appendChild(th);
    });
    const tbody = html('<tbody></tbody>');
    rows.forEach((r,i) => {
      const tr = document.createElement('tr');
      tr.style.animation = `cardIn var(--t-slow) var(--ease-out) ${i*30}ms both`;
      cols.forEach(c=>{
        const td = document.createElement('td');
        if(c.isActions){
          td.appendChild(rowActions(tab, r.id));
        }else{
          const v = r[c.key];
          td.innerHTML = c.format? c.format(v, r): esc(v);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    grid.innerHTML = '';
    grid.appendChild(thead);
    grid.appendChild(tbody);
    pageTransition();
  }

  function rowActions(tab, id){
    const wrap = html('<div class="row-actions"></div>');
    wrap.append(
      iconBtn(viewIcon(), 'View',   () => openForm(tab, id, true)),
      iconBtn(editIcon(), 'Edit',   () => openForm(tab, id, false)),
      iconBtn(delIcon(),  'Delete', () => removeRow(tab, id)),
    );
    return wrap;
  }
  function iconBtn(svg, label, onClick){
    const b = html(`<button class="icon-btn" title="${label}" aria-label="${label}"></button>`);
    b.appendChild(svg); b.addEventListener('click', onClick);
    return b;
  }
  function viewIcon(){ return html('<svg width="16" height="16" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'); }
  function editIcon(){ return html('<svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 21l4.5-1 10-10a2.1 2.1 0 10-3-3l-10 10L4 21zM14 6l4 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'); }
  function delIcon(){ return html('<svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 7h16M7 7v12a2 2 0 002 2h6a2 2 0 002-2V7M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'); }

  /* ---------- Modal CRUD ---------- */
  const modal = qs('#modal');
  const modalTitle = qs('#modalTitle');
  const formBody = qs('#formBody');
  const modalClose = qs('#modalClose'); const modalCancel = qs('#modalCancel'); const modalSave = qs('#modalSave');
  let editCtx = { tab:null, id:null, readonly:false };

  modalClose.addEventListener('click', hideModal);
  modalCancel.addEventListener('click', hideModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) hideModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') hideModal(); });

  function openForm(tab, id=null, readonly=false){
    editCtx = { tab, id, readonly };
    formBody.innerHTML = '';
    modalSave.classList.toggle('hidden', readonly);
    const action = id ? (readonly ? 'View ' : 'Edit ') : 'Create ';
    const noun = { trucks:'truck', trailers:'trailer', repairs:'repair', expenses:'expense' }[tab];
    modalTitle.textContent = action + noun;

    const rec = id ? data[tab].find(x=> x.id===id) : {};
    const fields = fieldsFor(tab, rec);
    fields.forEach(f => formBody.appendChild(fieldEl(f, rec[f.name] ?? f.default ?? '')));

    showModal();
    const first = formBody.querySelector('input,select,textarea'); first?.focus();
  }
  function showModal(){ modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
  function hideModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  modalSave.addEventListener('click', onSave);

  function fieldsFor(tab, rec){
    if(tab==='trucks') return [
      { name:'plate',   label:'Plate',         type:'text',   required:true },
      { name:'make',    label:'Make',          type:'text',   required:true },
      { name:'model',   label:'Model',         type:'text',   required:true },
      { name:'year',    label:'Year',          type:'number', min:1995, max:new Date().getFullYear()+1, required:true },
      { name:'mileage', label:'Mileage, km',   type:'number', step:100, min:0 },
      { name:'status',  label:'Status',        type:'select', options:[STATUS.ACTIVE, STATUS.SERVICE, STATUS.REPAIR], default:STATUS.ACTIVE }
    ];
    if(tab==='trailers') return [
      { name:'code',     label:'Code',         type:'text', required:true },
      { name:'type',     label:'Type',         type:'select', options:['Curtainsider','Refrigerated','Container','Lowboy','Flatbed'], default:'Curtainsider' },
      { name:'capacity', label:'Capacity, t',  type:'number', min:0, step:1 },
      { name:'status',   label:'Status',       type:'select', options:[STATUS.ACTIVE, STATUS.SERVICE, STATUS.REPAIR], default:STATUS.ACTIVE }
    ];
    if(tab==='repairs') return [
      { name:'date',       label:'Date',       type:'date', default: today() },
      { name:'assetType',  label:'Asset type', type:'select', options:['Truck','Trailer'], default:'Truck' },
      { name:'assetId',    label:'Asset ID',   type:'select', options: rec.assetType==='Trailer' ? data.trailers.map(t=>t.code) : data.trucks.map(t=>t.plate) },
      { name:'description',label:'Description',type:'text', required:true },
      { name:'cost',       label:'Cost',       type:'number', min:0, step:0.01, default:0 },
      { name:'status',     label:'Status',     type:'select', options:[REPAIR_STATUS.IN_PROGRESS, REPAIR_STATUS.DONE], default:REPAIR_STATUS.IN_PROGRESS }
    ];
    if(tab==='expenses') return [
      { name:'date',     label:'Date',     type:'date', default: today() },
      { name:'category', label:'Category', type:'select', options:['Fuel','Tolls/Fees','Parking','Office','Other'], default:'Fuel' },
      { name:'amount',   label:'Amount',   type:'number', min:0, step:0.01, default:0 },
      { name:'notes',    label:'Notes',    type:'text' }
    ];
    return [];
  }

  function fieldEl(cfg, value){
    const wrap = html('<div class="field"></div>');
    const id = 'f_'+cfg.name;
    wrap.appendChild(html(`<label for="${id}">${cfg.label}</label>`));
    let input;
    if(cfg.type==='select'){
      input = html(`<select id="${id}" ${editCtx.readonly?'disabled':''}></select>`);
      (cfg.options||[]).forEach(opt => input.appendChild(html(`<option value="${opt}">${opt}</option>`)));
      if(value) input.value = value;
    }else{
      input = html(`<input id="${id}" type="${cfg.type}" ${cfg.step?`step="${cfg.step}"`:''} ${cfg.min!=null?`min="${cfg.min}"`:''} ${cfg.max!=null?`max="${cfg.max}"`:''} ${cfg.required?'required':''} ${editCtx.readonly?'readonly':''} />`);
      input.value = value || cfg.default || '';
    }
    input.dataset.name = cfg.name;
    wrap.appendChild(input);

    if(cfg.name==='assetType'){
      input.addEventListener('change', ()=>{
        const assetSel = qs('#f_assetId', formBody);
        if(!assetSel) return;
        assetSel.innerHTML='';
        const list = input.value==='Trailer' ? data.trailers.map(t=>t.code) : data.trucks.map(t=>t.plate);
        list.forEach(v => assetSel.appendChild(html(`<option value="${v}">${v}</option>`)));
      });
    }
    return wrap;
  }

  async function onSave(){
    const tab = editCtx.tab;
    const fields = qsa('input,select,textarea', formBody);
    const payload = fields.reduce((acc,el)=>{ acc[el.dataset.name] = el.type==='number' ? (el.value? Number(el.value):0) : el.value; return acc; }, {});
    try{
      if(useApi){
        if(editCtx.id){
          const updated = await apiUpdate(tab, editCtx.id, payload);
          const i = data[tab].findIndex(x=> x.id===editCtx.id);
          if(i>-1) data[tab][i] = updated; else data[tab].unshift(updated);
          toast('Saved');
        }else{
          const created = await apiCreate(tab, payload);
          data[tab].unshift(created);
          toast('Created');
        }
      }else{
        if(editCtx.id){
          const i = data[tab].findIndex(x=> x.id===editCtx.id);
          if(i>-1) data[tab][i] = { ...data[tab][i], ...payload };
          toast('Saved');
        }else{
          data[tab].unshift({ id: uid(), ...payload });
          toast('Created');
        }
      }
    }catch(e){
      console.error(e); toast('Save failed');
    }
    persist(); hideModal(); render();
  }

  async function removeRow(tab, id){
    if(!confirm('Delete this record?')) return;
    try{
      if(useApi){ await apiDelete(tab, id); }
      data[tab] = data[tab].filter(x=> x.id!==id);
      persist(); render(); toast('Deleted');
    }catch(e){ console.error(e); toast('Delete failed'); }
  }

  /* ---------- Navigation & scope ---------- */
  nav.addEventListener('click', e=>{
    const item = e.target.closest('.nav-item'); if(!item) return;
    state.tab = item.dataset.tab; state.sort = { key:null, dir:1 };
    qs('.seg-btn.active')?.classList.remove('active'); qsa('.seg-btn')[0].classList.add('active');
    state.scope='all';
    filterInput.value=''; state.filter='';
    render();
  });

  qsa('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      qsa('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.scope = btn.dataset.scope;
      render();
    });
  });

  /* ---------- Search & Filter ---------- */
  filterInput.addEventListener('input', e=>{ state.filter = e.target.value; render(); });
  globalSearch.addEventListener('input', e=>{
    state.filter = e.target.value; filterInput.value = e.target.value; render();
  });

  /* ---------- Export ---------- */
  exportBtn.addEventListener('click', ()=>{
    const rows = sortBy(applyFilter(applyScope(data[state.tab])));
    if(rows.length===0) return toast('No data. Try adjusting filters.');
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(',')].concat(rows.map(r=> cols.map(k => ('"'+String(r[k] ?? '').replaceAll('"','""')+'"')).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${state.tab}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  });

  /* ---------- Create ---------- */
  createBtn.addEventListener('click', ()=> openForm(state.tab));

  /* ---------- Theme ---------- */
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('tms-theme');
  setTheme(savedTheme ?? (prefersDark ? 'dark' : 'light'));
  themeToggle.addEventListener('click', ()=> smoothSetTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));
  themeToggle.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); themeToggle.click(); } });

  function setTheme(mode){
    document.documentElement.classList.toggle('light', mode==='light');
    themeToggle.classList.toggle('on', mode==='dark'); // knob right in dark
    localStorage.setItem('tms-theme', mode);
    toast(mode==='dark' ? 'Dark theme' : 'Light theme');
  }
  function smoothSetTheme(mode){
    // Create wipe overlay colored by target theme
    const wipe = document.createElement('div');
    wipe.className = 'theme-wipe';
    // Temporarily apply target palette to overlay only
    if(mode==='light') document.documentElement.classList.add('light'); else document.documentElement.classList.remove('light');
    document.body.appendChild(wipe);
    // After animation, finalize theme and remove overlay
    setTimeout(()=>{
      setTheme(mode);
      wipe.remove();
    }, 900);
  }

  /* ---------- Palette (⌘/Ctrl + K) ---------- */
  const commands = [
    { label:'Go to: Trucks',   action: ()=> goto('trucks') },
    { label:'Go to: Trailers', action: ()=> goto('trailers') },
    { label:'Go to: Repairs',  action: ()=> goto('repairs') },
    { label:'Go to: Expenses', action: ()=> goto('expenses') },
    { label:'Create record',   action: ()=> openForm(state.tab) },
    { label:'Export CSV',      action: ()=> exportBtn.click() },
    { label:'Toggle theme',    action: ()=> themeToggle.click() },
  ];
  function goto(tab){
    const btn = qs(`.nav-item[data-tab="${tab}"]`); if(btn) btn.click();
  }
  function openPalette(){
    palette.classList.add('open'); palette.setAttribute('aria-hidden','false');
    paletteInput.value=''; renderPalette('');
    setTimeout(()=> paletteInput.focus(), 0);
  }
  function closePalette(){ palette.classList.remove('open'); palette.setAttribute('aria-hidden','true'); }
  function renderPalette(q){
    const items = commands.filter(c=> c.label.toLowerCase().includes(q.toLowerCase()));
    paletteList.innerHTML=''; items.forEach((c,i)=>{
      const it = html(`<div class="palette-item" data-idx="${i}">${c.label}</div>`);
      it.addEventListener('click', ()=>{ c.action(); closePalette(); });
      paletteList.appendChild(it);
    });
    activePaletteIndex = items.length? 0 : -1; highlightPalette(activePaletteIndex);
  }
  let activePaletteIndex = -1;
  function highlightPalette(i){
    qsa('.palette-item', paletteList).forEach((el,idx)=> el.classList.toggle('active', idx===i));
  }
  document.addEventListener('keydown', e=>{
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette(); }
    if(e.key==='Escape'){ closePalette(); }
  });
  paletteInput.addEventListener('input', e=> renderPalette(e.target.value));
  paletteInput.addEventListener('keydown', e=>{
    const items = qsa('.palette-item', paletteList);
    if(e.key==='ArrowDown'){ e.preventDefault(); if(items.length){ activePaletteIndex = (activePaletteIndex+1) % items.length; highlightPalette(activePaletteIndex); } }
    if(e.key==='ArrowUp'){ e.preventDefault(); if(items.length){ activePaletteIndex = (activePaletteIndex-1+items.length) % items.length; highlightPalette(activePaletteIndex); } }
    if(e.key==='Enter'){ e.preventDefault(); if(items[activePaletteIndex]) items[activePaletteIndex].click(); }
  });

  /* ---------- Mobile sidebar (optional) ---------- */
  // Tap on brand to toggle sidebar on narrow screens
  brandCard.addEventListener('click', ()=>{
    if(window.innerWidth <= 900){
      qs('.sidebar').classList.toggle('open');
    }
  });

  /* ---------- KPI ---------- */
  function updateKpi(){
    const total = data.trucks.length + data.trailers.length;
    const repairing = data.trucks.filter(t=> t.status!==STATUS.ACTIVE).length + data.trailers.filter(t=> t.status!==STATUS.ACTIVE).length;
    const month = new Date().toISOString().slice(0,7);
    const monthSum = data.expenses.filter(e=> e.date?.slice(0,7)===month).reduce((s,e)=> s+Number(e.amount||0), 0);
    const avgRepair = data.repairs.length ? data.repairs.reduce((s,r)=> s+Number(r.cost||0),0)/data.repairs.length : 0;
    countUp(kpiTotal, total, number);
    countUp(kpiRepairing, repairing, number);
    countUp(kpiMonthCost, monthSum, money);
    countUp(kpiAvgRepair, avgRepair, money);
    const bar = qs('#barRepair');
    if(bar){ const ratio = total? (repairing/total)*100 : 0; requestAnimationFrame(()=> bar.style.width = ratio.toFixed(1)+'%'); }
  }
  function countUp(el, value, fmt){
    if(!el) return; const start = 0; const dur = 720; const t0 = performance.now();
    function step(t){
      const p = Math.min(1, (t - t0)/dur); const eased = 1 - Math.pow(1-p,3);
      const v = start + (value - start)*eased;
      el.textContent = fmt(v);
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Page transition ---------- */
  function pageTransition(){
    const panel = qs('.panel');
    panel?.animate([
      { transform:'translateY(8px) scale(.995)', opacity:.0, filter:'blur(2px)' },
      { transform:'translateY(0) scale(1)', opacity:1, filter:'blur(0)' }
    ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  /* ---------- Utilities ---------- */
  function today(){ return new Date().toISOString().slice(0,10); }

  /* ---------- Charts ---------- */
  function monthsRange(n){
    const out=[]; const d=new Date(); d.setDate(1);
    for(let i=n-1;i>=0;i--){ const x=new Date(d.getFullYear(), d.getMonth()-i, 1); out.push(x.toISOString().slice(0,7)); }
    return out; // ['YYYY-MM']
  }
  function buildSeries(items, key='amount', months=6){
    const range = monthsRange(months);
    const map = Object.fromEntries(range.map(m=>[m,0]));
    items.forEach(it=>{ const m = it.date?.slice(0,7); if(map[m]!=null){ map[m] += Number(it[key]||0); }});
    return { labels: range, values: range.map(m=> map[m]) };
  }
  function setupCanvas(cv){
    const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = Math.max(600, Math.floor(rect.width*dpr));
    cv.height = Math.floor(180*dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr,dpr);
    return { ctx, dpr, w: cv.width/dpr, h: cv.height/dpr };
  }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function drawGrid(ctx, w, h){
    const rows = 4; ctx.strokeStyle = getCss('--border'); ctx.lineWidth=1; ctx.globalAlpha=.6;
    ctx.beginPath();
    for(let i=0;i<=rows;i++){ const y = 10 + (h-20)*(i/rows); ctx.moveTo(10,y); ctx.lineTo(w-10,y); }
    ctx.stroke(); ctx.globalAlpha=1;
  }
  function toPoints(values, w, h, pad, min, max){
    const xstep = (w-2*pad)/Math.max(1, values.length-1);
    return values.map((v,i)=>{
      const x = pad + i*xstep; const y = h - pad - (v-min)/(max-min || 1)*(h-2*pad);
      return {x,y};
    });
  }
  function smoothPath(ctx, pts){
    if(pts.length<2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1;i<pts.length-1;i++){
      const xc = (pts[i].x + pts[i+1].x)/2;
      const yc = (pts[i].y + pts[i+1].y)/2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  }
  function getCss(varName){ return getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); }
  function animateLine(canvasId, tipId, labels, values, color){
    const cv = qs('#'+canvasId); if(!cv) return; const tip = qs('#'+tipId);
    const { ctx, w, h } = setupCanvas(cv);
    const pad=10; const max=Math.max(1,...values); const min=Math.min(0,...values);
    const pts = toPoints(values, w, h, pad, min, max);
    let start; const dur=900; // ms
    function frame(ts){
      if(!start) start = ts; const t = Math.min(1, (ts-start)/dur); const p=easeOutCubic(t);
      ctx.clearRect(0,0,w,h);
      drawGrid(ctx,w,h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0,0,w, h*(p));
      ctx.clip();
      ctx.lineWidth=2; ctx.strokeStyle=color; ctx.fillStyle=color;
      smoothPath(ctx, pts); ctx.stroke();
      // area fill
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, color.replace('1)', '.22)'));
      grad.addColorStop(1, color.replace('1)', '0)'));
      ctx.lineTo(w-pad, h-pad); ctx.lineTo(pad, h-pad); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
      ctx.restore();
      if(p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // tooltip
    const enter = ()=> cv.closest('.chart-card')?.classList.add('show-tip');
    const leave = ()=> { const card=cv.closest('.chart-card'); card?.classList.remove('show-tip'); if(tip) tip.style.opacity=0; };
    cv.onmouseenter = enter; cv.onmouseleave = leave;
    cv.onmousemove = (e)=>{
      if(!tip) return;
      const rect = cv.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const idx = Math.max(0, Math.min(pts.length-1, Math.round((x-10)/((w-20)/Math.max(1,values.length-1)))));
      tip.textContent = `${labels[idx]}: ${values[idx].toFixed(2)}`;
      tip.style.left = `${x}px`; tip.style.top = `${y}px`; tip.style.opacity = 1;
    };
  }
  function drawCharts(){
    try{
      const exp = buildSeries(data.expenses||[], 'amount', 6);
      const rep = buildSeries(data.repairs||[], 'cost', 6);
      const c = getCss('--brand') || '#ff3b30';
      const brandRGBA = 'rgba('+hexToRgb(c)+',1)';
      const warnRGBA = 'rgba(255,193,7,1)';
      animateLine('expensesChart','expensesTip', exp.labels, exp.values, brandRGBA);
      animateLine('repairsChart','repairsTip', rep.labels, rep.values, warnRGBA);
      // Sparklines
      drawSpark('sparkExp', exp.values, brandRGBA);
      drawSpark('sparkRep', rep.values, warnRGBA);
      const activeRate = monthsRange(6).map(()=> (data.trucks.length+data.trailers.length)? ( (data.trucks.filter(t=>t.status===STATUS.ACTIVE).length+data.trailers.filter(t=>t.status===STATUS.ACTIVE).length) ):0);
      drawSpark('sparkAct', activeRate, 'rgba(102,204,102,1)');
      const avgMileage = [ ...Array(6) ].map(()=> (data.trucks.reduce((s,t)=>s+(t.mileage||0),0)/(data.trucks.length||1)) );
      drawSpark('sparkMil', avgMileage, 'rgba(100,149,237,1)');
    }catch(e){ /* ignore */ }
  }
  function drawSpark(id, values, color){
    const cv = qs('#'+id); if(!cv) return; const { ctx, w, h } = setupCanvas(cv);
    const pad=6; const max=Math.max(1,...values); const min=Math.min(0,...values);
    const pts = toPoints(values, w, h, pad, min, max);
    drawGrid(ctx,w,h);
    ctx.lineWidth=1.6; ctx.strokeStyle=color; smoothPath(ctx, pts); ctx.stroke();
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, color.replace('1)', '.18)'));
    grad.addColorStop(1, color.replace('1)', '0)'));
    ctx.lineTo(w-pad, h-pad); ctx.lineTo(pad, h-pad); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  }
  function hexToRgb(hex){
    const s = hex.replace('#','');
    const bigint = parseInt(s.length===3 ? s.split('').map(x=>x+x).join('') : s, 16);
    return [(bigint>>16)&255, (bigint>>8)&255, bigint&255].join(',');
  }

  /* ---------- Init ---------- */
  async function init(){
    // Try to enable API mode and sync data
    try{
      const trucks = await apiList('trucks');
      const [trailers, repairs, expenses] = await Promise.all([
        apiList('trailers'), apiList('repairs'), apiList('expenses')
      ]);
      data = { trucks, trailers, repairs, expenses };
      useApi = true;
      persist();
      toast('Connected to API');
      setConn(true);
      render();
    }catch(e){
      console.log('API unavailable, staying in offline mode:', e?.message || e);
      setConn(false);
      render();
    }
  }
  init();

})();
