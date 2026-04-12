export default function StatusBadge({ tone = 'neutral', children }) {
  const toneClasses = {
    neutral: 'border-white/10 bg-white/[0.05] text-slate-200',
    success: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-100',
    warning: 'border-amber-400/20 bg-amber-400/12 text-amber-100',
    info: 'border-violet-300/20 bg-violet-300/12 text-violet-100',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClasses[tone]}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}
