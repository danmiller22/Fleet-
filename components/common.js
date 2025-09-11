// Common components
export const Card = ({ title, toolbar, children }) => {
  return (
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
};

export const Modal = ({ children, onClose }) => {
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
};

export const Pill = ({ tone = "neutral", children }) => {
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

export const StatusDot = ({ status }) => {
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
