import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Moon,
  Sun,
  Bell,
  Search,
  Settings as SettingsIcon,
  CheckCircle2,
  FileBarChart,
  GaugeCircle,
  Car,
  Package,
  Truck,
  BarChart3,
  LayoutGrid,
  LogOut,
  Wrench,
  DollarSign,
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import * as Recharts from 'recharts';

const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip: ReTooltip, Legend, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar } = Recharts;

/** Utilities **/
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).slice(2, 9);
const store = {
  get(k, fallback){ try{return JSON.parse(localStorage.getItem(k)||'null') ?? fallback;}catch{return fallback;} },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

/**
 * Apple-like font stack: prefers SF Pro on Apple devices.
 */
const fontStack = {
  fontFamily:
    'system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif'
};

// Small helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");

// Toast
const toast = {
  show(msg){ const el = document.getElementById('toast'); if(!el) return; el.textContent = msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 1800); },
  success(msg){ this.show(msg); },
  error(msg){ this.show(msg); }
};

/** Local state hooks & seeds **/
const STAGES = ['New','Diagnose','Estimate','Approval','Parts','Repair','QA','Closed'];
const STAGE_ALL = '__ALL__';
const SEED = {
  trucks: [
    { id: '3252', make: 'Freightliner', model: 'Cascadia', year: 2021, vin: '1FUJHHDR0MLMJ4879', status: 'Active', miles: 618230, pmInterval: 20000, pmDueAt: 618230, notes: 'Oil change due now' },
    { id: '5496', make: 'Volvo', model: 'VNL', year: 2024, vin: '4V4NC9EH0LN223912', status: 'Active', miles: 409659, pmInterval: 20000, pmDueAt: 409659, notes: 'Windshield replaced 2025-09-04' },
    { id: '7834', make: 'Peterbilt', model: '579', year: 2020, vin: '1XPWD40X1ED123456', status: 'Service', miles: 742100, pmInterval: 20000, pmDueAt: 760000, notes: 'Scheduled maintenance' },
  ],
  trailers: [
    { id: 'XTRA-40123', type: 'Dry Van', owner: 'XTRA Lease', status: 'On Road', extId: 'SkyB-12345', notes: 'External tracked' },
    { id: 'UST-9001', type: 'Dry Van', owner: 'US TEAM', status: 'Yard', extId: '—', notes: 'Ready' },
    { id: 'WABASH-5567', type: 'Refrigerated', owner: 'Wabash', status: 'On Road', extId: 'WB-5567', notes: 'Temperature controlled' },
  ],
  cases: [
    { id: uid(), assetType: 'truck', assetId: '3252', title: 'Coolant leak', priority: 'High', stage: 'Diagnose', createdAt: Date.now() - 86400000*2, cost: 0, assigned: 'Jack', timeline: [ { t: Date.now() - 86400000*2, note: 'Driver reports coolant on ground.' } ], invoices: [] },
    { id: uid(), assetType: 'trailer', assetId: 'XTRA-40123', title: 'ABS light ON', priority: 'Medium', stage: 'Parts', createdAt: Date.now() - 86400000*1, cost: 75, assigned: 'Aidar', timeline: [ { t: Date.now()- 86400000, note: 'Mobile tech scheduled.' } ], invoices: [] },
    { id: uid(), assetType: 'truck', assetId: '7834', title: 'Brake inspection', priority: 'Low', stage: 'Closed', createdAt: Date.now() - 86400000*7, cost: 450, assigned: 'Mike', timeline: [ { t: Date.now() - 86400000*7, note: 'Routine brake check completed.' } ], invoices: [] }
  ],
  ledger: [
    { id: uid(), type: 'expense', amount: 535, category: 'Tires', note: 'Steer tire fix — Houston, TX', ref: '2023/00' },
    { id: uid(), type: 'expense', amount: 325, category: 'Windshield', note: 'Windshield mobile — Wichita, KS', ref: '2025/09/04' },
    { id: uid(), type: 'income', amount: 4200, category: 'Load', note: 'Load #AB-778, Jack', ref: '2025/09/03' },
    { id: uid(), type: 'expense', amount: 890, category: 'Fuel', note: 'Fuel stop — Denver, CO', ref: '2025/09/05' },
    { id: uid(), type: 'income', amount: 3800, category: 'Load', note: 'Load #CD-445, Sarah', ref: '2025/09/06' },
  ]
};

function useSeededState(key, initial) {
  const [state, setState] = useState(() => store.get(key, null) ?? (initial ?? SEED[key]));
  useEffect(()=>{ store.set(key, state); }, [key, state]);
  return [state, setState];
}

// Modern UI Components with faster animations
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
};

const cardTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }
};

const Chip = ({ active, children, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
      active
        ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {children}
  </motion.button>
);

const Card = ({ title, toolbar, children }) => (
  <motion.div
    {...cardTransition}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className="rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur border border-gray-200 dark:border-gray-800 shadow-sm"
  >
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
      <div className="flex items-center gap-2">{toolbar}</div>
    </div>
    <div className="p-4">{children}</div>
  </motion.div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <motion.button
    whileHover={{ x: 2, transition: { duration: 0.15 } }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "w-full h-10 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
      active
        ? "bg-gray-900 text-white dark:bg-white dark:text-black shadow-sm"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    )}
  >
    <Icon size={18} />
    <span className="leading-none">{label}</span>
  </motion.button>
);

const TopButton = ({ icon: Icon, label, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all duration-200"
    aria-label={label}
  >
    <Icon size={16} />
  </motion.button>
);

const Pill = ({ tone = "neutral", children }) => {
  const tones = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  };
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", tones[tone])}>{children}</span>
  );
};

const StatusDot = ({ status }) => {
  const m = {
    Active: "bg-emerald-500",
    "In-progress": "bg-blue-500",
    Delayed: "bg-amber-500",
    Cancelled: "bg-rose-500",
    "On Road": "bg-blue-500",
    Yard: "bg-gray-500",
    Service: "bg-amber-500",
    Repair: "bg-rose-500"
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full", m[status] || "bg-gray-400")} />;
};

// Dark mode hook with smooth transitions
function useDarkMode(){
  const [dark, setDark] = useState(()=>{
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored) {
      return stored === "dark";
    } else {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  });
  
  useEffect(()=>{
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  
  return [dark, setDark];
}

/** Dashboard Section **/
function Dashboard({ trucks, trailers, cases, ledger }){
  const exp = useMemo(() => ledger.filter(l=>l.type==='expense').reduce((a,b)=>a+b.amount,0), [ledger]);
  const inc = useMemo(() => ledger.filter(l=>l.type==='income').reduce((a,b)=>a+b.amount,0), [ledger]);
  const openCases = cases.filter(c=>c.stage!=='Closed').length;

  // Asset handlers
  const handleView = (asset) => {
    toast.success(`Viewing details for ${asset.type} ${asset.id}`);
  };

  const handleEdit = (asset) => {
    toast.success(`Opening edit form for ${asset.type} ${asset.id}`);
  };

  const handleDelete = (asset) => {
    toast.success(`Delete request for ${asset.type} ${asset.id}`);
  };

  const chartData = useMemo(()=>{
    const months = ["Sep 22", "Oct 22", "Nov 22", "Dec 22", "Jan 23", "Feb 23", "Mar 23", "Apr 23", "May 23", "Jun 23", "Jul 23", "Aug 23"];
    return months.map((m, i) => ({
      name: m,
      Revenue: inc / 12 + i * 300 + (i % 3 === 0 ? 800 : -400),
      Expenses: exp / 12 + i * 200 + (i % 2 === 0 ? 300 : -200)
    }));
  },[ledger, inc, exp]);

  const barData = [
    { name: "Oil", uv: 24 },
    { name: "Fluid", uv: 12 },
    { name: "Battery", uv: 18 },
    { name: "Belts", uv: 14 },
    { name: "Susp.", uv: 20 }
  ];

  return (
    <motion.div {...pageTransition} className="space-y-4">
      {/* Metrics Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          title="Fleet performance"
          toolbar={
            <div className="flex items-center gap-2">
              <Chip active>Monthly</Chip>
              <Chip>Yearly</Chip>
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl font-semibold">{fmt.format(inc)}</div>
            <Pill tone="success">↑ 2.9%</Pill>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.5} />
                    <stop offset="95%" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <ReTooltip contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="Revenue" strokeWidth={2} fillOpacity={0.2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card
          title="Driver Performance"
          toolbar={
            <div className="flex items-center gap-2">
              <Chip active>Monthly</Chip>
              <Chip>Yearly</Chip>
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl font-semibold">{fmt.format(exp)}</div>
            <Pill tone="danger">↓ 2.9%</Pill>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice().reverse()} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <ReTooltip contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="Expenses" strokeWidth={2} fillOpacity={0.2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card
          title="Maintenance overview"
          toolbar={
            <div className="flex items-center gap-2">
              <Chip active>Monthly</Chip>
              <Chip>Yearly</Chip>
            </div>
          }
        >
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <ReTooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="uv" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card
          title="Cost details"
          toolbar={
            <div className="flex items-center gap-2">
              <Chip active>Monthly</Chip>
              <Chip>Yearly</Chip>
            </div>
          }
        >
          <div className="flex items-baseline gap-3 mb-4">
            <div className="text-3xl font-semibold">{fmt.format(inc - exp)}</div>
            <Pill tone="success">↑ 2.9%</Pill>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              ["Oil cost", "+$515"],
              ["Fluid cost", "+$109"],
              ["Battery cost", "+$80"],
              ["Belt & Hose cost", "+$150"],
              ["Suspension cost", "+$200"]
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Fleet Status */}
      <Card
        title="Fleet Status"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{trucks.length + trailers.length} assets</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all duration-200"
            >
              Export CSV
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Asset ID</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Make/Model</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...trucks.map(t => ({...t, type: 'Truck', makeModel: `${t.make} ${t.model}`})), 
                ...trailers.map(t => ({...t, type: 'Trailer', makeModel: t.type}))].map((asset, i) => (
                <motion.tr 
                  key={asset.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{asset.id}</td>
                  <td className="py-3 pr-4">{asset.type}</td>
                  <td className="py-3 pr-4">{asset.makeModel}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2"><StatusDot status={asset.status}/> {asset.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{asset.notes}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleView(asset)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-700 rounded transition-colors duration-150 text-blue-600"
                      >
                        <Eye size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleEdit(asset)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-700 rounded transition-colors duration-150 text-green-600"
                      >
                        <Edit size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleDelete(asset)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

/** Trucks Section с интерактивным CRUD **/
function TrucksPage({ trucks, setTrucks }) {
  const [modal, setModal] = useState({ open: false, mode: 'add', truck: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyTruck = { id: '', make: '', model: '', year: '', vin: '', status: 'Active', miles: '', notes: '' };

  const handleSave = (truck) => {
    if (modal.mode === 'add') {
      setTrucks([...trucks, { ...truck, id: Math.random().toString(36).slice(2, 9) }]);
    } else {
      setTrucks(trucks.map(t => t.id === truck.id ? truck : t));
    }
    setModal({ open: false, mode: 'add', truck: null });
  };

  const handleDelete = (id) => {
    setTrucks(trucks.filter(t => t.id !== id));
    setConfirmDelete(null);
  };

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <Card
        title="Trucks Management"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{trucks.length} trucks</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-sm font-semibold transition-all duration-200"
              onClick={() => setModal({ open: true, mode: 'add', truck: emptyTruck })}
            >
              <Plus size={16} /> Add Truck
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Make/Model</th>
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">VIN</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Mileage</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {trucks.map((truck, i) => (
                <motion.tr 
                  key={truck.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4 font-medium">{truck.id}</td>
                  <td className="py-3 pr-4">{truck.make} {truck.model}</td>
                  <td className="py-3 pr-4">{truck.year}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{truck.vin}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={truck.status}/> {truck.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{truck.miles?.toLocaleString()} mi</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150" onClick={() => setModal({ open: true, mode: 'edit', truck })}>
                        <Edit size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600" onClick={() => setConfirmDelete(truck.id)}>
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Модальное окно для добавления/редактирования */}
        {modal.open && (
          <Modal onClose={() => setModal({ open: false, mode: 'add', truck: null })}>
            <TruckForm
              truck={modal.truck}
              mode={modal.mode}
              onSave={handleSave}
              onCancel={() => setModal({ open: false, mode: 'add', truck: null })}
            />
          </Modal>
        )}

        {/* Подтверждение удаления */}
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(null)}>
            <div className="p-6 text-center">
              <div className="mb-4 text-lg">Delete this truck?</div>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleDelete(confirmDelete)}
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </Card>
    </motion.div>
  );
}

// Универсальное модальное окно
function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-0 min-w-[320px] max-w-[95vw] relative animate-fadeIn">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-black dark:hover:text-white" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}

// Форма для добавления/редактирования Truck
function TruckForm({ truck, mode, onSave, onCancel }) {
  const [form, setForm] = useState(truck);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, year: Number(form.year), miles: Number(form.miles) });
  };
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="text-lg font-semibold mb-2">{mode === 'add' ? 'Add Truck' : 'Edit Truck'}</div>
      <div className="grid grid-cols-2 gap-3">
        <input name="make" value={form.make} onChange={handleChange} placeholder="Make" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
        <input name="model" value={form.model} onChange={handleChange} placeholder="Model" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
        <input name="year" value={form.year} onChange={handleChange} placeholder="Year" type="number" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
        <input name="vin" value={form.vin} onChange={handleChange} placeholder="VIN" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
        <input name="miles" value={form.miles} onChange={handleChange} placeholder="Mileage" type="number" required className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
        <select name="status" value={form.status} onChange={handleChange} className="col-span-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800">
          <option value="Active">Active</option>
          <option value="Service">Service</option>
          <option value="Repair">Repair</option>
        </select>
        <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="col-span-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800" />
      </div>
      <div className="flex gap-3 justify-end mt-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {mode === 'add' ? 'Add' : 'Save'}
        </motion.button>
      </div>
    </form>
  );
}

/** Trailers Section **/
function TrailersPage({ trailers, setTrailers }) {
  return (
    <motion.div {...pageTransition} className="space-y-4">
      <Card
        title="Trailers Management"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{trailers.length} trailers</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-sm font-semibold transition-all duration-200"
            >
              <Plus size={16} /> Add Trailer
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">External ID</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {trailers.map((trailer, i) => (
                <motion.tr 
                  key={trailer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4 font-medium">{trailer.id}</td>
                  <td className="py-3 pr-4">{trailer.type}</td>
                  <td className="py-3 pr-4">{trailer.owner}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={trailer.status}/> {trailer.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{trailer.extId}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{trailer.notes}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Eye size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Edit size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600">
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

/** Cases Section **/
function CasesPage({ cases, setCases }) {
  return (
    <motion.div {...pageTransition} className="space-y-4">
      <Card
        title="Cases Management"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{cases.length} cases</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-sm font-semibold transition-all duration-200"
            >
              <Plus size={16} /> New Case
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">Asset</th>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Priority</th>
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Assigned</th>
                <th className="pb-2 pr-4">Cost</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {cases.map((case_, i) => (
                <motion.tr 
                  key={case_.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {case_.assetType === 'truck' ? <Truck size={16} /> : <Package size={16} />}
                      <span className="font-medium">{case_.assetId}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{case_.title}</td>
                  <td className="py-3 pr-4">
                    <Pill tone={case_.priority === 'High' ? 'danger' : case_.priority === 'Medium' ? 'warning' : 'neutral'}>
                      {case_.priority}
                    </Pill>
                  </td>
                  <td className="py-3 pr-4">
                    <Pill tone={case_.stage === 'Closed' ? 'success' : 'neutral'}>
                      {case_.stage}
                    </Pill>
                  </td>
                  <td className="py-3 pr-4">{case_.assigned}</td>
                  <td className="py-3 pr-4 font-medium">{fmt.format(case_.cost)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Eye size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Edit size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600">
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

/** Finance Section **/
function FinancePage({ ledger, setLedger }) {
  const totalIncome = useMemo(() => ledger.filter(l => l.type === 'income').reduce((a, b) => a + b.amount, 0), [ledger]);
  const totalExpenses = useMemo(() => ledger.filter(l => l.type === 'expense').reduce((a, b) => a + b.amount, 0), [ledger]);
  const netProfit = totalIncome - totalExpenses;

  return (
    <motion.div {...pageTransition} className="space-y-4">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Total Income">
          <div className="text-2xl font-semibold text-emerald-600">{fmt.format(totalIncome)}</div>
        </Card>
        <Card title="Total Expenses">
          <div className="text-2xl font-semibold text-red-600">{fmt.format(totalExpenses)}</div>
        </Card>
        <Card title="Net Profit">
          <div className={cn("text-2xl font-semibold", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
            {fmt.format(netProfit)}
          </div>
        </Card>
      </div>

      <Card
        title="Financial Records"
        toolbar={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{ledger.length} records</Pill>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-sm font-semibold transition-all duration-200"
            >
              <Plus size={16} /> Add Record
            </motion.button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Note</th>
                <th className="pb-2 pr-4">Reference</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {ledger.map((record, i) => (
                <motion.tr 
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="py-3 pr-4">
                    <Pill tone={record.type === 'income' ? 'success' : 'danger'}>
                      {record.type}
                    </Pill>
                  </td>
                  <td className="py-3 pr-4">{record.category}</td>
                  <td className="py-3 pr-4 font-medium">
                    <span className={record.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                      {record.type === 'income' ? '+' : '-'}{fmt.format(record.amount)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{record.note}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{record.ref}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Eye size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                        <Edit size={14} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-150 text-red-600">
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

/** Generic Page Component **/
function GenericPage({ title, icon: Icon }) {
  return (
    <motion.div {...pageTransition} className="space-y-4">
      <Card title={title}>
        <div className="text-center py-12">
          <Icon size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This section is under development and will be available soon.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toast.success(`${title} section coming soon!`)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Get Notified
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}

/** Main App Component **/
function App(){
  // THEME with smooth transitions
  const [dark, setDark] = useDarkMode();

  // NAVIGATION
  const sidebar = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "trucks", label: "Trucks", icon: Truck },
    { id: "trailers", label: "Trailers", icon: Package },
    { id: "cases", label: "Cases", icon: ClipboardList },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];
  const [page, setPage] = useState("dashboard");

  // TABS
  const [tab, setTab] = useState("Dashboard");
  const tabs = ["Dashboard", "Fleet", "Reports"];

  const [range, setRange] = useState({ from: "Dec 10, 2022", to: "Jul 18, 2023" });

  // Data
  const [trucks, setTrucks] = useSeededState('trucks', SEED.trucks);
  const [trailers, setTrailers] = useSeededState('trailers', SEED.trailers);
  const [cases, setCases] = useSeededState('cases', SEED.cases);
  const [ledger, setLedger] = useSeededState('ledger', SEED.ledger);

  const renderPage = () => {
    switch(page) {
      case 'dashboard':
        return <Dashboard trucks={trucks} trailers={trailers} cases={cases} ledger={ledger} />;
      case 'trucks':
        return <TrucksPage trucks={trucks} setTrucks={setTrucks} />;
      case 'trailers':
        return <TrailersPage trailers={trailers} setTrailers={setTrailers} />;
      case 'cases':
        return <CasesPage cases={cases} setCases={setCases} />;
      case 'finance':
        return <FinancePage ledger={ledger} setLedger={setLedger} />;
      case 'analytics':
        return <GenericPage title="Analytics" icon={BarChart3} />;
      case 'maintenance':
        return <GenericPage title="Maintenance" icon={Wrench} />;
      case 'settings':
        return <GenericPage title="Settings" icon={SettingsIcon} />;
      default:
        return <GenericPage title="Page" icon={LayoutGrid} />;
    }
  };

  return (
    <div className={cn(dark ? "dark" : "", "transition-colors duration-500 ease-out")}>
      <div style={fontStack} className="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-500 ease-out antialiased dark:bg-[#0b0b0f] dark:text-gray-100">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="w-full px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                src="https://usteam.net/image/logo/usteam_logo_r_wb.png"
                alt="US TEAM Fleet Logo"
                className="inline-flex h-12 w-auto rounded-none object-contain bg-transparent"
                style={{ background: 'transparent' }}
              />
              <span className="hidden sm:inline text-xl font-bold tracking-tight">US TEAM Fleet</span>
            </div>
            <div className="mx-3 text-sm text-gray-400">/</div>
            <nav className="flex items-center gap-1">
              {tabs.map((t) => (
                <Chip key={t} active={t === tab} onClick={() => setTab(t)}>
                  {t}
                </Chip>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:flex">
                <input
                  placeholder="Search"
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-sm transition-all duration-200"
                />
                <Search className="absolute left-3 top-2.5" size={16} />
              </div>
              <TopButton icon={Bell} label="Notifications" />
              <TopButton icon={SettingsIcon} label="Settings" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDark((d) => !d)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: dark ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
                <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold transition-all duration-200"
              >
                <img src="https://i.pravatar.cc/36?img=5" alt="avatar" className="h-7 w-7 rounded-full" />
                <span className="text-sm hidden sm:inline">Admin</span>
                <ChevronDown size={16} />
              </motion.button>
            </div>
          </div>
        </header>

        {/* App Shell */}
        <div className="w-full px-4 grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-2 lg:col-span-2 space-y-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-2 bg-white/70 dark:bg-zinc-900/70 border border-gray-200 dark:border-gray-800 backdrop-blur transition-colors duration-300"
            >
              <p className="px-2 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">Main menu</p>
              <div className="space-y-1">
                {sidebar.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <SidebarItem
                      icon={item.icon}
                      label={item.label}
                      active={page === item.id}
                      onClick={() => setPage(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between px-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1 transition-colors duration-200"
                >
                  <LogOut size={14}/> Log out
                </motion.button>
                <span className="text-xs text-gray-400">v1.0</span>
              </div>
            </motion.div>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-10 lg:col-span-10 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="text-2xl font-semibold">
                {sidebar.find(s => s.id === page)?.label || 'Dashboard'}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRange((r) =>
                    r.from === "Dec 10, 2022"
                      ? { from: "Jan 01, 2023", to: "Sep 01, 2023" }
                      : { from: "Dec 10, 2022", to: "Jul 18, 2023" }
                  );
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all duration-200"
              >
                {range.from} - {range.to} <ChevronDown size={16} />
              </motion.button>
            </motion.div>

            {/* Content based on selected page */}
            <AnimatePresence mode="wait">
              <motion.div key={page}>
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

      </div>

      {/* Toast host */}
      <div id="toast" role="status" aria-live="polite" className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg transition-all duration-300 opacity-0 pointer-events-none z-50"></div>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App/>);