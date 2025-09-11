import React, { useEffect, useMemo, useState } from 'react';
import { fetchDeliveriesSafe, supabase } from './lib/supabase.js';
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
  LayoutGrid,
  LogOut,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
} from 'recharts';

// Font stack like macOS/iOS
const fontStack = {
  fontFamily:
    'system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif',
};

// Demo data
const months = [
  'Sep 22', 'Oct 22', 'Nov 22', 'Dec 22', 'Jan 23', 'Feb 23', 'Mar 23', 'Apr 23', 'May 23', 'Jun 23', 'Jul 23', 'Aug 23',
];
const lineData = months.map((m, i) => ({ name: m, value: 110000 + i * 3800 + (i % 3 === 0 ? 8000 : -4000) }));
const barData = [
  { name: 'Oil', uv: 24 },
  { name: 'Fluid', uv: 12 },
  { name: 'Battery', uv: 18 },
  { name: 'Belts', uv: 14 },
  { name: 'Susp.', uv: 20 },
];
const seedDeliveries = [
  { id: '3457790', fleetId: '76031847', fleet: 'Tata Nexon', status: 'In-progress', phone: '+61488850430' },
  { id: '37737320', fleetId: '55700223', fleet: 'Hyundai i10', status: 'Active', phone: '+61480013910' },
  { id: '39201015', fleetId: '55700201', fleet: 'Kia Seltos', status: 'Delayed', phone: '+61470012345' },
];

// Utils
const cn = (...cls) => cls.filter(Boolean).join(' ');

const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors',
      active
        ? 'bg-black text-white dark:bg-white dark:text-black shadow'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
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
    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
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
      'w-full h-10 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors',
      active ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
    )}
  >
    <Icon size={16} />
    {label}
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

const Pill = ({ tone = 'neutral', children }) => {
  const tones = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return <span className={cn('px-2 py-1 rounded-full text-xs', tones[tone])}>{children}</span>;
};

const StatusDot = ({ status }) => {
  const m = {
    Active: 'bg-emerald-500',
    'In-progress': 'bg-blue-500',
    Delayed: 'bg-amber-500',
    Cancelled: 'bg-rose-500',
  };
  return <span className={cn('inline-block w-2 h-2 rounded-full', m[status] || 'bg-gray-400')} />;
};

function WrenchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4l-5.3 5.3a2 2 0 1 0 2.8 2.8l5.3-5.3a4.5 4.5 0 0 0 6.4-6.4l-2.2 2.2a1.5 1.5 0 1 1-2.1-2.1l2.2-2.2z" />
    </svg>
  );
}

export default function FastFleetPreview() {
  // Dark mode
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) setDark(stored === 'dark');
    else if (window.matchMedia) setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  // Nav
  const sidebar = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'trucks', label: 'Trucks', icon: Truck },
    { id: 'trailers', label: 'Trailers', icon: Package },
    { id: 'reports', label: 'Report & analytics', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];
  const [page, setPage] = useState('dashboard');
  const [rows, setRows] = useState(seedDeliveries);
  const [range, setRange] = useState({ from: 'Dec 10, 2022', to: 'Jul 18, 2023' });
  const cycleRange = () =>
    setRange(r => (r.from === 'Dec 10, 2022' ? { from: 'Jan 01, 2023', to: 'Sep 01, 2023' } : { from: 'Dec 10, 2022', to: 'Jul 18, 2023' }));

  const [tab, setTab] = useState('Dashboard');
  const totals = useMemo(() => {
    const seed = tab === 'Order' ? 142000 : tab === 'Delivery' ? 120400 : 156098;
    return { fleetPerformance: seed, driverPerformance: seed - 2940, trend: 2.9 };
  }, [tab]);

  // Fetch deliveries from Supabase if env is configured
  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data, error } = await fetchDeliveriesSafe();
      if (!ignore && data && !error && Array.isArray(data) && data.length) {
        // Normalize keys in case columns differ in casing
        const mapped = data.map(d => ({
          id: d.id ?? '',
          fleetId: d.fleetId ?? d.fleet_id ?? '',
          fleet: d.fleet ?? d.vehicle ?? '',
          status: d.status ?? 'Active',
          phone: d.phone ?? '',
        }));
        setRows(mapped);
      }
    })();
    return () => { ignore = true };
  }, []);

  return (
    <div className={dark ? 'dark' : ''}>
      <div style={fontStack} className="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-300 antialiased dark:bg-[#0b0b0f] dark:text-gray-100">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><GaugeCircle /> US TEAM Fleet</div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input type="search" placeholder="Search" className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-sm" />
                <Search className="absolute left-3 top-2.5" size={16} />
              </div>
              <TopButton icon={Bell} label="Notifications" />
              <TopButton icon={SettingsIcon} label="Settings" />
              <button onClick={() => setDark(d => !d)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold">
                {dark ? <Sun size={16} /> : <Moon size={16} />}<span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
              </button>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold">
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">A</div>
                <span className="text-sm hidden sm:inline">Admin</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Shell */}
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 space-y-2">
            <div className="rounded-2xl p-2 bg-white/70 dark:bg-zinc-900/70 border border-gray-200 dark:border-gray-800">
              <p className="px-2 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">Main menu</p>
              <div className="space-y-1">
                {sidebar.map(item => (
                  <SidebarItem key={item.id} icon={item.icon} label={item.label} active={page === item.id} onClick={() => setPage(item.id)} />
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between px-2">
                <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1"><LogOut size={14} /> Log out</button>
                <span className="text-xs text-gray-400">v1.0</span>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold">Dashboard</div>
              <button onClick={cycleRange} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold">
                {range.from} - {range.to} <ChevronDown size={16} />
              </button>
            </div>

            {/* Top charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                title="Fleet performance"
                toolbar={<div className="flex items-center gap-2"><Chip active>Monthly</Chip><Chip onClick={() => setTab('Order')}>Yearly</Chip></div>}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-semibold">{totals.fleetPerformance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</div>
                  <Pill tone="success">↑ {totals.trend}%</Pill>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis hide />
                      <ReTooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="value" strokeWidth={2} stroke="#8884d8" fillOpacity={0.2} fill="url(#grad1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card
                title="Driver Performance"
                toolbar={<div className="flex items-center gap-2"><Chip active>Monthly</Chip><Chip>Yearly</Chip></div>}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-semibold">{totals.driverPerformance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</div>
                  <Pill tone="danger">↓ 2.9%</Pill>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData.slice().reverse()} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis hide />
                      <ReTooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="value" strokeWidth={2} stroke="#82ca9d" fillOpacity={0.2} fill="#82ca9d33" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Middle Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Maintenance overview" toolbar={<div className="flex items-center gap-2"><Chip active>Monthly</Chip><Chip>Yearly</Chip></div>}>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <ReTooltip contentStyle={{ borderRadius: 12 }} />
                      <Bar dataKey="uv" radius={[8, 8, 0, 0]} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Cost details" toolbar={<div className="flex items-center gap-2"><Chip active>Monthly</Chip><Chip>Yearly</Chip></div>}>
                <div className="flex items-baseline gap-3 mb-4">
                  <div className="text-3xl font-semibold">$156,098</div>
                  <Pill tone="success">↑ 2.9%</Pill>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    ['Oil cost', '+$515'],
                    ['Fluid cost', '+$109'],
                    ['Battery cost', '+$80'],
                    ['Belt & Hose cost', '+$150'],
                    ['Suspension cost', '+$200'],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{k}</span>
                      <span className="font-medium">{v}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Delivery */}
            <Card title="Delivery" toolbar={<div className="flex items-center gap-2"><Pill tone="neutral">{deliveries.length} items</Pill><button className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold">Export CSV</button></div>}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">Delivery ID</th>
                      <th className="pb-2 pr-4">Fleet ID</th>
                      <th className="pb-2 pr-4">Assigned Fleet</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Contact Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((d, i) => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="py-3 pr-4">{i + 1}</td>
                        <td className="py-3 pr-4 font-medium">{d.id}</td>
                        <td className="py-3 pr-4">{d.fleetId}</td>
                        <td className="py-3 pr-4">{d.fleet}</td>
                        <td className="py-3 pr-4"><span className="inline-flex items-center gap-2"><StatusDot status={d.status} /> {d.status}</span></td>
                        <td className="py-3 pr-4"><a className="underline decoration-dotted" href={`tel:${d.phone}`}>{d.phone}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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
            onClick={() => alert('Demo OK')}
          >
            <CheckCircle2 size={16} /> Demo OK
          </motion.button>
        </AnimatePresence>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-500 dark:text-gray-400">
          Designed with smooth motion • Light & Dark themes • Ready for backend wiring
        </footer>
      </div>
    </div>
  );
}
