import { cx } from './ui';

function SharedField({ as = 'input', className = '', options = [], ...props }) {
  const fieldClassName = cx(
    'w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3.5 text-sm text-slate-50 shadow-inner shadow-slate-950/30 outline-none transition duration-200 placeholder:text-slate-500 focus:border-violet-300/40 focus:bg-slate-950/75 focus:ring-2 focus:ring-violet-300/20',
    as === 'textarea' ? 'min-h-[132px] resize-none' : '',
    as === 'select' ? 'appearance-none pr-10' : '',
    className
  );

  if (as === 'textarea') {
    return <textarea className={fieldClassName} {...props} />;
  }

  if (as === 'select') {
    return (
      <select className={fieldClassName} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return <input className={fieldClassName} {...props} />;
}

export default function Input({
  as = 'input',
  className = '',
  error = '',
  hint = '',
  label = '',
  options = [],
  ...props
}) {
  return (
    <label className={cx('block space-y-2', className)}>
      {label && <span className="text-sm font-medium text-slate-200">{label}</span>}
      <SharedField as={as} options={options} {...props} />
      {(error || hint) && (
        <p className={cx('text-xs leading-5', error ? 'text-rose-300' : 'text-slate-400')}>
          {error || hint}
        </p>
      )}
    </label>
  );
}
