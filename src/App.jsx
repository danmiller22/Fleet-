import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { Card } from './components/index.jsx';
import { pageTransition, toast } from './utils';
import { TrailersPage } from './components/TrailersPage.jsx';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return [dark, setDark];
}

const seedTrailers = [
  { id: 'XTRA-40123', type: 'Dry Van', owner: 'XTRA Lease', status: 'On Road', extId: 'SkyB-12345', notes: 'External tracked' },
  { id: 'UST-9001', type: 'Dry Van', owner: 'US TEAM', status: 'Yard', extId: 'UST-9001-EXT', notes: 'Ready' },
  { id: 'WABASH-5567', type: 'Refrigerated', owner: 'Wabash', status: 'On Road', extId: 'WB-5567', notes: 'Temperature controlled' },
];

export default function App() {
  const [dark, setDark] = useDarkMode();
  const [page, setPage] = useState('trailers');
  const [trailers, setTrailers] = useState(() => seedTrailers);
  const range = useMemo(() => ({ from: 'Jan 01, 2025', to: 'Sep 01, 2025' }), []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        {/* Header */}
        <header className="px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="logo" className="h-8 w-8 rounded" />
              <div className="text-xl font-semibold">US TEAM Fleet</div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDark(d => !d)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold"
              >
                <motion.div animate={{ rotate: dark ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
                <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
              </motion.button>
              <motion.button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold">
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium">A</span>
                </div>
                <span className="text-sm hidden sm:inline">Admin</span>
                <ChevronDown size={16} />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 space-y-2">
            <Card title="Main menu" toolbar={<div /> }>
              <div className="space-y-2">
                {[
                  { id: 'trailers', label: 'Trailers' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border ${page === item.id ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'} transition-colors`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between px-2">
                <span className="text-xs text-gray-400">v1.0</span>
              </div>
            </Card>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            <motion.div {...pageTransition} className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{page === 'trailers' ? 'Trailers' : 'Dashboard'}</div>
              <button
                onClick={() => toast.success('Range picker coming soon')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold"
              >
                {range.from} - {range.to} <ChevronDown size={16} />
              </button>
            </motion.div>

            {page === 'trailers' && (
              <TrailersPage trailers={trailers} setTrailers={setTrailers} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
