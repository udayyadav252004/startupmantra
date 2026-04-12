export default function EmptyState({ title, body, action = null, compact = false }) {
  return (
    <div className={`rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] text-center ${compact ? 'p-5' : 'p-8'}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/12 text-sm font-semibold text-violet-100">
        AI
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
