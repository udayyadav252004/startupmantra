export default function SectionTitle({ eyebrow, title, body, action }) {
  return (
    <div className="space-y-3">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-200/80">{eyebrow}</p>}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          {body && <p className="max-w-3xl text-sm leading-7 text-slate-300">{body}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
