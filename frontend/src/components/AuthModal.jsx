import { AnimatePresence, motion } from 'framer-motion';

import Button from './Button';
import Card from './Card';
import Input from './Input';

function getModalCopy(authMode, intent) {
  if (intent === 'save') {
    return {
      title: authMode === 'signup' ? 'Create an account to save your progress' : 'Login to save your progress',
      description: 'Keep exploring freely. Sign in only when you want to store ideas and roadmap history.',
    };
  }

  return {
    title: authMode === 'signup' ? 'Create your workspace' : 'Welcome back',
    description: 'Use StartupMantra right away, then sign in whenever you want to keep your work.',
  };
}

export default function AuthModal({
  authError,
  authFieldErrors,
  authForm,
  authMessage,
  authMode,
  handleAuthChange,
  handleAuthSubmit,
  handleGoogleSignIn,
  hasFirebaseConfig,
  intent = 'general',
  isCheckingSession,
  isOpen,
  isSubmittingAuth,
  onClose,
  setAuthMode,
  showGoogleSignIn,
}) {
  const copy = getModalCopy(authMode, intent);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg"
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Card className="overflow-hidden" padding="lg" tone="hero">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_55%)]" />
              <div className="relative space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Founder access</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{copy.title}</h2>
                    <p className="text-sm leading-7 text-slate-300">{copy.description}</p>
                  </div>

                  <Button onClick={onClose} size="sm" variant="ghost">
                    Close
                  </Button>
                </div>

                {intent === 'save' ? (
                  <div className="rounded-[22px] border border-violet-300/20 bg-violet-300/12 p-4 text-sm leading-6 text-violet-50">
                    Login to save your progress. Your current work stays in this session until you choose to save it.
                  </div>
                ) : null}

                {!hasFirebaseConfig ? (
                  <div className="rounded-[22px] border border-amber-400/20 bg-amber-400/12 p-4 text-sm leading-6 text-amber-50">
                    Firebase Auth is not configured yet. Add the <code>VITE_FIREBASE_*</code> values to enable login and saved work.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Button className="w-full" onClick={() => setAuthMode('signup')} size="md" variant={authMode === 'signup' ? 'primary' : 'secondary'}>
                        Sign up
                      </Button>
                      <Button className="w-full" onClick={() => setAuthMode('login')} size="md" variant={authMode === 'login' ? 'primary' : 'secondary'}>
                        Log in
                      </Button>
                    </div>

                    {authMessage ? (
                      <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/12 p-4 text-sm leading-6 text-emerald-50">
                        {authMessage}
                      </div>
                    ) : null}

                    {authError ? (
                      <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/12 p-4 text-sm leading-6 text-rose-50">
                        {authError}
                      </div>
                    ) : null}

                    <form className="space-y-4" onSubmit={handleAuthSubmit}>
                      {authMode === 'signup' ? (
                        <Input
                          error={authFieldErrors.name}
                          label="Name"
                          name="name"
                          onChange={handleAuthChange}
                          placeholder="Ada Lovelace"
                          value={authForm.name}
                        />
                      ) : null}

                      <Input
                        error={authFieldErrors.email}
                        label="Email"
                        name="email"
                        onChange={handleAuthChange}
                        placeholder="ada@startup.com"
                        type="email"
                        value={authForm.email}
                      />

                      <Input
                        error={authFieldErrors.password}
                        hint={authMode === 'signup' ? 'Minimum 6 characters' : 'Use the password you created during signup'}
                        label="Password"
                        name="password"
                        onChange={handleAuthChange}
                        placeholder="At least 6 characters"
                        type="password"
                        value={authForm.password}
                      />

                      <Button className="w-full" loading={isSubmittingAuth || isCheckingSession} size="lg" type="submit">
                        {isCheckingSession ? 'Checking your session' : authMode === 'signup' ? 'Create account' : 'Sign in'}
                      </Button>
                    </form>

                    {showGoogleSignIn ? (
                      <Button className="w-full" onClick={handleGoogleSignIn} size="lg" variant="secondary">
                        Continue with Google
                      </Button>
                    ) : null}

                    <p className="text-sm leading-6 text-slate-400">
                      Email signups require verification before login. Google sign-in is supported for a faster verified path.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
