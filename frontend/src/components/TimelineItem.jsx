import { motion } from 'framer-motion';

import StatusBadge from './StatusBadge';
import { cx } from './ui';

export default function TimelineItem({
  description,
  index = 0,
  isLast = false,
  meta,
  points = [],
  title,
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.32, ease: 'easeOut', delay: index * 0.05 }}
    >
      <div className="flex flex-col items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/12 text-sm font-semibold text-violet-50">
          {String(index + 1).padStart(2, '0')}
        </div>
        {!isLast && <div className="mt-3 w-px flex-1 bg-[linear-gradient(180deg,rgba(165,180,252,0.55),rgba(165,180,252,0))]" />}
      </div>

      <div className="min-w-0 flex-1 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_44px_rgba(2,6,23,0.18)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">Milestone</p>
            <h4 className="mt-2 text-lg font-semibold text-white">{title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          </div>
          {meta ? <StatusBadge tone="info">{meta}</StatusBadge> : null}
        </div>

        {points.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {points.map((point) => (
              <span
                className={cx('rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300')}
                key={point}
              >
                {point}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
