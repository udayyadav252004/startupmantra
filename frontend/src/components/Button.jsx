import { cx } from './ui';

const variantClasses = {
  primary:
    'border border-violet-300/20 bg-[linear-gradient(135deg,rgba(129,140,248,1),rgba(168,85,247,0.92))] text-white shadow-[0_18px_40px_rgba(76,29,149,0.35)] hover:translate-y-[-1px] hover:shadow-[0_22px_48px_rgba(76,29,149,0.45)]',
  secondary:
    'border border-white/10 bg-white/[0.05] text-slate-100 hover:border-violet-300/20 hover:bg-white/[0.09]',
  ghost:
    'border border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white',
  subtle:
    'border border-cyan-400/15 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/14',
};

const sizeClasses = {
  sm: 'h-10 rounded-2xl px-4 text-sm',
  md: 'h-11 rounded-2xl px-5 text-sm',
  lg: 'h-12 rounded-2xl px-6 text-sm',
};

export default function Button({
  children,
  className = '',
  disabled = false,
  leftSlot = null,
  loading = false,
  rightSlot = null,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      {...props}
      aria-busy={loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      type={type}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
      {!loading && leftSlot}
      <span>{children}</span>
      {!loading && rightSlot}
    </button>
  );
}
