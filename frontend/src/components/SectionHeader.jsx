export default function SectionHeader({ action = null, icon = 'SM', subtitle = '', title }) {
  return (
    <div className="space-y-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/12 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-100">
        {icon}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p> : null}
      </div>

      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
