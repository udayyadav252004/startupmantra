import { motion } from 'framer-motion';

export default function Tabs({ items, onChange, value }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.id === value;

        return (
          <button
            className={`relative overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition ${
              active
                ? 'border-violet-300/24 text-violet-50'
                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white'
            }`}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {active ? (
              <motion.span
                className="absolute inset-0 bg-[linear-gradient(135deg,rgba(129,140,248,0.24),rgba(168,85,247,0.2))]"
                layoutId="roadmap-tab-active"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
