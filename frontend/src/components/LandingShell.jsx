import Button from './Button';
import Card from './Card';
import Input from './Input';
import SectionTitle from './SectionTitle';

const landingFeatures = [
  {
    eyebrow: 'Idea intelligence',
    title: 'Generate sharper startup directions',
    body: 'Move from a broad category to concrete founder-ready concepts with positioning you can actually test.',
  },
  {
    eyebrow: 'Execution clarity',
    title: 'Turn fuzzy ideas into roadmaps',
    body: 'Get milestones, tasks, risks, tools, and a realistic sequence so founders know what to do next.',
  },
  {
    eyebrow: 'Mentor guidance',
    title: 'Ask context-aware strategy questions',
    body: 'Chat with an AI mentor that uses your idea and roadmap context instead of generic startup advice.',
  },
];

const productSteps = [
  {
    step: '01',
    title: 'Generate a credible idea',
    body: 'Start from a category or your own concept and let StartupMantra propose sharper opportunities.',
  },
  {
    step: '02',
    title: 'Save and structure the best one',
    body: 'Store the idea privately, add your audience and budget, and create a roadmap that feels actionable.',
  },
  {
    step: '03',
    title: 'Refine with mentor feedback',
    body: 'Use mentor chat to stress-test the plan, clarify scope, and decide the next best founder move.',
  },
];

function FeatureCard({ feature }) {
  return (
    <Card tone="soft" padding="md" className="min-h-[210px]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/80">{feature.eyebrow}</p>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{feature.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{feature.body}</p>
    </Card>
  );
}

function StepCard({ item }) {
  return (
    <Card tone="soft" padding="md" className="min-h-[188px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-200/80">Step {item.step}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">Founder flow</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
    </Card>
  );
}

function StatTile({ label, value, detail }) {
  return (
    <Card tone="soft" padding="md" className="min-h-[150px]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </Card>
  );
}

export default function LandingShell({
  authError,
  authFieldErrors,
  authForm,
  authMessage,
  authMode,
  handleAuthChange,
  handleAuthSubmit,
  handleGoogleSignIn,
  hasFirebaseConfig,
  isCheckingSession,
  isSubmittingAuth,
  jumpToPrimaryAction,
  scrollToSection,
  setAuthMode,
  showGoogleSignIn,
}) {
  return (
    <div className="space-y-14 pb-10">
      <section className="grid gap-8 xl:grid-cols-[1.06fr_0.94fr] xl:items-start">
        <div className="space-y-8">
          <Card tone="hero" padding="lg" className="noise-overlay overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(165,180,252,0.16),transparent_55%)]" />
            <div className="relative space-y-8">
              <div className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">
                AI founder workspace
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Turn Your Startup Idea Into a Real Execution Plan
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                  Validate concepts, shape execution roadmaps, and get founder-grade guidance in one premium AI workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={jumpToPrimaryAction} size="lg">
                  Generate Your First Idea
                </Button>
                <Button onClick={() => scrollToSection('features')} size="lg" variant="secondary">
                  Explore the product
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatTile label="Private" value="Scoped" detail="Every founder only sees their own ideas, roadmaps, and mentor context." />
                <StatTile label="AI flow" value="4 steps" detail="Generate, save, roadmap, and chat inside one clear founder loop." />
                <StatTile label="Trust" value="Verified" detail="Email verification and guarded data access keep the workspace production-ready." />
              </div>
            </div>
          </Card>

          <section id="features" className="space-y-5">
            <SectionTitle
              body="Everything in the experience is tuned for founders who need clarity fast, not another vague AI playground."
              eyebrow="Product value"
              title="A product experience built for serious startup thinking"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {landingFeatures.map((feature) => (
                <FeatureCard feature={feature} key={feature.title} />
              ))}
            </div>
          </section>

          <section id="product-flow" className="space-y-5">
            <SectionTitle
              body="The product flow is designed to remove ambiguity: start with possibility, narrow to conviction, then keep refining with context-aware support."
              eyebrow="How it works"
              title="Landing to execution in three calm steps"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {productSteps.map((item) => (
                <StepCard item={item} key={item.step} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28">
          <Card tone="default" padding="lg" className="noise-overlay overflow-hidden">
            <div className="pointer-events-none absolute -top-10 right-0 h-48 w-48 rounded-full bg-violet-400/12 blur-3xl" />
            <div className="relative space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-200/80">Live founder preview</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">What the product feels like once you are inside</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Idea snapshot</p>
                  <h3 className="mt-3 text-base font-semibold text-white">AI workflow assistant for solo founders</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Positioning, validation plan, and a simple monetization path surfaced in one pass.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Roadmap</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">4 milestones, 8 tasks, and a tighter MVP recommendation.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mentor chat</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">Context-aware answers about validation, pricing, and founder tradeoffs.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card id="auth-panel" tone="hero" padding="lg" className="overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_50%)]" />
            <div className="relative mx-auto max-w-md space-y-6 text-center">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Founder access</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{authMode === 'signup' ? 'Create your workspace' : 'Welcome back'}</h2>
                <p className="text-sm leading-7 text-slate-300">
                  Sign in with a verified account so your ideas, roadmaps, and mentor sessions stay private by design.
                </p>
              </div>

              {!hasFirebaseConfig ? (
                <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/12 p-4 text-left text-sm leading-6 text-amber-50">
                  Firebase Auth is not configured yet. Add the `VITE_FIREBASE_*` values to unlock verified founder accounts.
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

                  {authMessage && (
                    <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/12 p-4 text-left text-sm leading-6 text-emerald-50">
                      {authMessage}
                    </div>
                  )}
                  {authError && (
                    <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/12 p-4 text-left text-sm leading-6 text-rose-50">
                      {authError}
                    </div>
                  )}

                  <form className="space-y-4 text-left" onSubmit={handleAuthSubmit}>
                    {authMode === 'signup' && (
                      <Input error={authFieldErrors.name} label="Name" name="name" onChange={handleAuthChange} placeholder="Ada Lovelace" value={authForm.name} />
                    )}
                    <Input error={authFieldErrors.email} label="Email" name="email" onChange={handleAuthChange} placeholder="ada@startup.com" type="email" value={authForm.email} />
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

                  {showGoogleSignIn && (
                    <Button className="w-full" onClick={handleGoogleSignIn} size="lg" variant="secondary">
                      Continue with Google
                    </Button>
                  )}

                  <p className="text-sm leading-6 text-slate-400">
                    Email signups require verification before login. Google sign-in is supported for a faster verified path.
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
