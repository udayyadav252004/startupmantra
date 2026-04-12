import { useEffect, useState } from 'react';

import { cx } from './ui';

const defaultMessages = [
  'Understanding the founder context',
  'Sequencing the next smartest moves',
  'Refining the output for clarity',
];

export default function Loader({
  className = '',
  compact = false,
  detail = 'The AI is shaping the next response.',
  messages = defaultMessages,
  title = 'Thinking... ',
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

  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-[24px] border border-violet-300/15 bg-[linear-gradient(180deg,rgba(79,70,229,0.12),rgba(15,23,42,0.75))] shadow-[0_16px_36px_rgba(49,46,129,0.22)]',
        compact ? 'p-4' : 'p-6',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(165,180,252,0.18),transparent_35%)]" />
      <div className="relative flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/12">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300/45" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-violet-200" />
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-sm leading-6 text-slate-300">{detail}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-violet-200/80">
            {messages[activeMessageIndex] || messages[0]}
          </p>
        </div>
      </div>
    </div>
  );
}
