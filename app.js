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
  ClipboardList
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

// Modern UI Components
const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-sm font-semibold transition-all",
      active
        ? "bg-black text-white dark:bg-white dark:text-black shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {children}
  </button>
);

const Card = ({ title, toolbar, children }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ type: "spring", stiffness: 260, damping: 26 }}
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
  <button
    onClick={onClick}
    className={cn(
      "w-full h-10 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
      active
        ? "bg-gray-900 text-white dark:bg-white dark:text-black"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    )}
  >
    <Icon size={18} />
    <span className="leading-none">{label}</span>
  </button>
);

const TopButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold"
    aria-label={label}
  >
    <Icon size={16} />
  </button>
);

const Pill = ({ tone = "neutral", children }) => {
  const tones = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  };
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs", tones[tone])}>{children}</span>
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

// Dark mode hook
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
    <div className="space-y-4">
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
            <button className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold">Export CSV</button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...trucks.map(t => ({...t, type: 'Truck', makeModel: `${t.make} ${t.model}`})), 
                ...trailers.map(t => ({...t, type: 'Trailer', makeModel: t.type}))].map((asset, i) => (
                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="py-3 pr-4">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{asset.id}</td>
                  <td className="py-3 pr-4">{asset.type}</td>
                  <td className="py-3 pr-4">{asset.makeModel}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2"><StatusDot status={asset.status}/> {asset.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{asset.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/** Main App Component **/
function App(){
  // THEME
  const [dark, setDark] = useDarkMode();

  // NAVIGATION
  const sidebar = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "trucks", label: "Trucks", icon: Truck },
    { id: "trailers", label: "Trailers", icon: Package },
    { id: "cases", label: "Cases", icon: ClipboardList },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
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

  return (
    <div className={dark ? "dark" : ""}>
      <div style={fontStack} className="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-300 antialiased dark:bg-[#0b0b0f] dark:text-gray-100">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">T</span>
              <span className="hidden sm:inline">TranGo TMS</span>
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
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-sm"
                />
                <Search className="absolute left-3 top-2.5" size={16} />
              </div>
              <TopButton icon={Bell} label="Notifications" />
              <TopButton icon={SettingsIcon} label="Settings" />
              <button
                onClick={() => setDark((d) => !d)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}<span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
              </button>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold">
                <img src="https://i.pravatar.cc/36?img=5" alt="avatar" className="h-7 w-7 rounded-full" />
                <span className="text-sm hidden sm:inline">Admin</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* App Shell */}
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 space-y-2">
            <div className="rounded-2xl p-2 bg-white/70 dark:bg-zinc-900/70 border border-gray-200 dark:border-gray-800">
              <p className="px-2 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">Main menu</p>
              <div className="space-y-1">
                {sidebar.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={page === item.id}
                    onClick={() => setPage(item.id)}
                  />
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between px-2">
                <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1"><LogOut size={14}/> Log out</button>
                <span className="text-xs text-gray-400">v1.0</span>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold">
                {sidebar.find(s => s.id === page)?.label || 'Dashboard'}
              </div>
              <button
                onClick={() => {
                  setRange((r) =>
                    r.from === "Dec 10, 2022"
                      ? { from: "Jan 01, 2023", to: "Sep 01, 2023" }
                      : { from: "Dec 10, 2022", to: "Jul 18, 2023" }
                  );
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold"
              >
                {range.from} - {range.to} <ChevronDown size={16} />
              </button>
            </div>

            {/* Content based on selected page */}
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {page === 'dashboard' && <Dashboard trucks={trucks} trailers={trailers} cases={cases} ledger={ledger} />}
                {page !== 'dashboard' && (
                  <Card title={`${sidebar.find(s => s.id === page)?.label} Section`}>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">🚧</div>
                      <p>This section is under development.</p>
                      <p className="text-sm mt-2">The original functionality will be integrated with the new design.</p>
                    </div>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Floating help */}
        <AnimatePresence>
          <motion.button
            key="help"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileTap={{ scale: 0.98 }}
            className="fixed bottom-5 right-5 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg bg-black text-white dark:bg-white dark:text-black"
            onClick={() => toast.success("New design applied! All sections will be updated progressively.")}
          >
            <CheckCircle2 size={16}/> New Design
          </motion.button>
        </AnimatePresence>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-500 dark:text-gray-400">
          Designed with smooth, Apple-like motion • Light & Dark themes • Ready for backend integration
        </footer>
      </div>

      {/* Toast host */}
      <div id="toast" role="status" aria-live="polite" className="fixed bottom-18 left-1/2 transform -translate-x-1/2 translate-y-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg transition-transform duration-300 opacity-0 pointer-events-none z-50"></div>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App/>);