export default function SectionTitle({ action, body, compact = false, eyebrow, title }) {
  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-200/80">{eyebrow}</p> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          <h2 className={compact ? 'text-xl font-semibold tracking-tight text-white sm:text-2xl' : 'text-2xl font-semibold tracking-tight text-white sm:text-3xl'}>
            {title}
          </h2>
          {body ? (
            <p className={compact ? 'max-w-2xl text-sm leading-6 text-slate-400' : 'max-w-3xl text-sm leading-6 text-slate-300'}>
              {body}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}
