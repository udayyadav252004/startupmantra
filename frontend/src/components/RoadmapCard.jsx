import { motion } from 'framer-motion';

import Card from './Card';
import StatusBadge from './StatusBadge';

const accentClasses = {
  violet: 'border-violet-300/22 bg-violet-300/12 text-violet-100',
  cyan: 'border-cyan-300/22 bg-cyan-300/12 text-cyan-100',
  emerald: 'border-emerald-300/22 bg-emerald-300/12 text-emerald-100',
};

export default function RoadmapCard({ accent = 'violet', icon = '01', index = 1, meta = '', summary = '', title }) {
  return (
    <motion.div transition={{ duration: 0.22, ease: 'easeOut' }} whileHover={{ scale: 1.02, y: -3 }}>
      <Card className="rounded-[20px] border-white/10" padding="md" tone="roadmap">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${accentClasses[accent]}`}>
            {icon}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Step {String(index).padStart(2, '0')}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
              </div>
              {meta ? <StatusBadge tone="info">{meta}</StatusBadge> : null}
            </div>

            <p className="max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
