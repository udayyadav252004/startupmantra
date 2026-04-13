import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function ProgressiveText({ animate, text }) {
  const [visibleText, setVisibleText] = useState(animate ? '' : text);

  useEffect(() => {
    if (!animate) {
      setVisibleText(text);
      return undefined;
    }

    const words = text.split(' ');

    if (words.length <= 1) {
      setVisibleText(text);
      return undefined;
    }

    setVisibleText('');
    let nextIndex = 0;

    const intervalId = window.setInterval(() => {
      nextIndex += 1;
      setVisibleText(words.slice(0, nextIndex).join(' '));

      if (nextIndex >= words.length) {
        window.clearInterval(intervalId);
      }
    }, 38);

    return () => window.clearInterval(intervalId);
  }, [animate, text]);

  const isAnimating = animate && visibleText !== text;

  return (
    <span>
      {visibleText}
      {isAnimating ? <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-violet-200/80 align-middle" /> : null}
    </span>
  );
}

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div
        className={`max-w-[92%] rounded-[24px] px-4 py-3 shadow-[0_16px_35px_rgba(2,6,23,0.18)] sm:max-w-[78%] ${
          isUser
            ? 'border border-violet-300/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.92),rgba(168,85,247,0.92))] text-white'
            : 'border border-white/10 bg-slate-950/80 text-slate-100'
        }`}
      >
        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isUser ? 'text-white/75' : 'text-violet-200/85'}`}>
          {isUser ? 'You' : 'Mentor'}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
          <ProgressiveText animate={Boolean(message.animate && !isUser)} text={message.content} />
        </p>
      </div>
    </motion.div>
  );
}
