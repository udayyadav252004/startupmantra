import Card from './Card';

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  const toneClasses = {
    success: 'border-emerald-400/20 bg-emerald-400/14 text-emerald-50',
    error: 'border-rose-400/20 bg-rose-400/14 text-rose-50',
    info: 'border-violet-300/20 bg-violet-300/14 text-violet-50',
    loading: 'border-cyan-400/20 bg-cyan-400/14 text-cyan-50',
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div className="w-full max-w-md space-y-3">
        {toasts.map((toast) => (
          <Card
            className={`toast-enter pointer-events-auto overflow-hidden border px-4 py-4 backdrop-blur ${toneClasses[toast.tone] || toneClasses.info}`}
            key={toast.id}
            padding="none"
            tone="soft"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xs font-semibold uppercase tracking-[0.2em]">
                {toast.tone === 'loading' ? 'AI' : 'SM'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm leading-6 opacity-85">{toast.description}</p>}
              </div>
              <button
                className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-black/35 hover:text-white"
                onClick={() => onDismiss(toast.id)}
                type="button"
              >
                Close
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
