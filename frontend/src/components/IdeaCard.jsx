import { motion } from 'framer-motion';

import Card from './Card';
import StatusBadge from './StatusBadge';

const variantClasses = {
  generated: 'border-violet-300/18 bg-[linear-gradient(180deg,rgba(129,140,248,0.12),rgba(15,23,42,0.6))] shadow-[0_18px_40px_rgba(79,70,229,0.12)]',
  saved: 'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(15,23,42,0.5))] shadow-[0_16px_36px_rgba(2,6,23,0.18)]',
};

export default function IdeaCard({
  action = null,
  active = false,
  badges = [],
  description = '',
  eyebrow = '',
  interactive = false,
  onClick,
  title,
  variant = 'saved',
}) {
  const content = (
    <Card
      className={`rounded-[18px] ${variantClasses[variant]} ${active ? 'ring-1 ring-violet-300/30' : ''}`}
      padding="md"
      tone="none"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{eyebrow}</p> : null}
            <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
          </div>
          {active ? <StatusBadge tone="info">Active</StatusBadge> : action}
        </div>

        {badges.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {badges.map((badge) => (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );

  if (!interactive) {
    return (
      <motion.div transition={{ duration: 0.2, ease: 'easeOut' }} whileHover={{ scale: 1.02, y: -2 }}>
        {content}
      </motion.div>
    );
  }

  return (
    <motion.button
      className="w-full text-left"
      onClick={onClick}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {content}
    </motion.button>
  );
}
