import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { cx } from './ui';

const defaultMessages = [
  'Analyzing the startup context',
  'Building the clearest next steps',
  'Finalizing the response',
];

export default function AnimatedLoader({
  className = '',
  compact = false,
  detail = 'The AI is shaping the next response.',
  messages = defaultMessages,
  title = 'Thinking...',
}) {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages.length || messages.length === 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveMessageIndex((current) => (current + 1) % messages.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [messages]);

  const activeMessage = messages[activeMessageIndex] || messages[0] || 'Thinking';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cx(
        'relative overflow-hidden rounded-[24px] border border-violet-300/15 bg-[linear-gradient(180deg,rgba(79,70,229,0.14),rgba(15,23,42,0.84))] shadow-[0_18px_46px_rgba(49,46,129,0.26)]',
        compact ? 'p-4' : 'p-6',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(165,180,252,0.18),transparent_35%)]" />

      <div className="relative space-y-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/12">
            <div className="relative h-5 w-5">
              <motion.span
                animate={{ opacity: [0.25, 0.85, 0.25], scale: [0.86, 1.08, 0.86] }}
                className="absolute inset-0 rounded-full bg-violet-200/40"
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="absolute inset-[5px] rounded-full bg-violet-100" />
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-sm leading-6 text-slate-300">{detail}</p>

            <AnimatePresence mode="wait">
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-xs uppercase tracking-[0.28em] text-violet-200/85"
                exit={{ opacity: 0, y: -6 }}
                initial={{ opacity: 0, y: 6 }}
                key={activeMessage}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {activeMessage}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {compact ? (
          <div className="flex gap-2">
            {messages.map((message, index) => (
              <motion.span
                animate={index === activeMessageIndex ? { opacity: 1, scaleX: 1 } : { opacity: 0.4, scaleX: 0.92 }}
                className="h-1.5 flex-1 rounded-full bg-violet-200/60"
                key={message}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {messages.map((message, index) => {
              const isActive = index === activeMessageIndex;

              return (
                <motion.div
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.58, y: 0 }}
                  className={cx(
                    'rounded-2xl border px-3 py-3 text-left transition',
                    isActive ? 'border-violet-200/20 bg-white/[0.08]' : 'border-white/8 bg-white/[0.03]'
                  )}
                  key={message}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm text-slate-100">{message}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
