import { cx } from './ui';

const toneClasses = {
  default:
    'border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.74))] shadow-[0_24px_60px_rgba(2,6,23,0.35)]',
  soft:
    'border border-white/8 bg-white/[0.05] shadow-[0_20px_45px_rgba(2,6,23,0.22)]',
  hero:
    'border border-violet-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,27,75,0.82))] shadow-[0_30px_80px_rgba(49,46,129,0.3)]',
  subtle:
    'border border-white/8 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.22)]',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  as = 'section',
  children,
  className = '',
  padding = 'md',
  tone = 'default',
  ...props
}) {
  const Component = as;

  return (
    <Component
      {...props}
      className={cx(
        'relative overflow-hidden rounded-[28px] backdrop-blur-xl transition duration-200',
        toneClasses[tone],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}
