import Button from './Button';
import Card from './Card';
import ChatBubble from './ChatBubble';
import EmptyState from './EmptyState';
import Input from './Input';
import Loader from './Loader';
import SectionTitle from './SectionTitle';
import StatusBadge from './StatusBadge';

const ideaCategories = ['tech', 'health', 'education', 'finance', 'productivity', 'climate'];
const mentorSuggestions = [
  'What should my MVP include first?',
  'How do I validate this idea in two weeks?',
  'What are the biggest risks in my plan?',
];
const workspaceSteps = ['Generate', 'Save', 'Roadmap', 'Mentor Chat'];
const ideaLoaderMessages = [
  'Scanning adjacent opportunities',
  'Comparing founder-friendly wedges',
  'Drafting stronger startup concepts',
];
const roadmapLoaderMessages = [
  'Understanding the founder problem',
  'Sequencing milestones and priorities',
  'Stress-testing risks before launch',
];
const chatLoaderMessages = [
  'Reading your startup context',
  'Thinking like a practical mentor',
  'Drafting a more useful answer',
];

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return 'Budget not set';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function RoadmapSection({ items, title, emptyText, renderItem, gridClassName = 'md:grid-cols-2' }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</h4>
      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">{emptyText}</div>
      ) : (
        <div className={`grid gap-3 ${gridClassName}`}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

export default function DashboardShell({
  activeRoadmapIdeaId,
  authUser,
  backendOnline,
  backendStatus,
  chatError,
  chatInput,
  chatMessages,
  dashboardError,
  generatedIdeas,
  generatorCategory,
  handleChatSubmit,
  handleGenerateRoadmap,
  handleIdeaFormChange,
  handleIdeaGeneratorSubmit,
  handleRefreshWorkspace,
  handleSelectIdea,
  handleSelectRoadmap,
  handleSignOut,
  handleSubmitIdea,
  handleUseGeneratedIdea,
  ideaFieldErrors,
  ideaForm,
  ideas,
  isGeneratingIdeas,
  isRefreshing,
  isSendingChat,
  isSubmittingIdea,
  roadmapData,
  selectedIdea,
  selectedIdeaRoadmaps,
  selectedRoadmap,
  setChatInput,
  setGeneratorCategory,
}) {
  return (
    <div className="space-y-6 pb-10">
      <Card tone="hero" padding="lg" className="noise-overlay overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.12),transparent_50%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Founder workspace</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back, {authUser.name}. Your product strategy canvas is ready.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Generate ideas, save the strongest ones, create execution plans, and ask sharper startup questions without losing context.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone="info">{authUser.email}</StatusBadge>
              <StatusBadge tone={backendOnline ? 'success' : 'warning'}>
                {backendOnline ? 'Workspace connected' : backendStatus}
              </StatusBadge>
              <Button loading={isRefreshing} onClick={handleRefreshWorkspace} size="sm" variant="secondary">
                Refresh workspace
              </Button>
              <Button onClick={handleSignOut} size="sm" variant="ghost">
                Sign out
              </Button>
            </div>
          </div>

          {dashboardError && (
            <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/12 p-4 text-sm leading-6 text-amber-50">
              {dashboardError}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            {workspaceSteps.map((step, index) => (
              <div key={step} className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card id="idea-studio" tone="default" padding="lg" className="overflow-hidden">
            <SectionTitle
              action={<StatusBadge tone="neutral">{generatedIdeas.length} generated now</StatusBadge>}
              body="Start with AI-assisted exploration, then turn the strongest concept into a saved founder draft."
              eyebrow="Idea studio"
              title="Generate and shape better startup concepts"
            />

            <div className="mt-8 space-y-6">
              <form className="space-y-5" onSubmit={handleIdeaGeneratorSubmit}>
                <div className="flex flex-wrap gap-2">
                  {ideaCategories.map((category) => (
                    <button
                      className={`rounded-full border px-3 py-2 text-sm font-medium capitalize transition ${generatorCategory === category ? 'border-violet-300/25 bg-violet-300/14 text-violet-50' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white'}`}
                      key={category}
                      onClick={() => setGeneratorCategory(category)}
                      type="button"
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <Input
                  hint="Choose a space like tech, education, finance, or a niche you want to explore."
                  label="Category"
                  onChange={(event) => setGeneratorCategory(event.target.value)}
                  placeholder="tech, health, education"
                  value={generatorCategory}
                />

                <Button className="w-full sm:w-auto" loading={isGeneratingIdeas} size="lg" type="submit">
                  Generate ideas
                </Button>
              </form>

              <div className="space-y-3">
                {isGeneratingIdeas ? (
                  <Loader
                    detail="Finding sharper startup directions with stronger positioning and clearer founder angles."
                    messages={ideaLoaderMessages}
                    title="Generating startup ideas..."
                  />
                ) : !generatedIdeas.length ? (
                  <EmptyState compact title="No ideas generated yet" body="Start with a category and StartupMantra will suggest founder-ready directions you can build on." />
                ) : (
                  generatedIdeas.map((idea, index) => (
                    <Card key={`${idea.title}-${index}`} padding="md" tone="soft">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/80">Idea {index + 1}</p>
                          <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{idea.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-400">{idea.explanation}</p>
                        </div>
                        <Button onClick={() => handleUseGeneratedIdea(idea)} size="sm" variant="secondary">
                          Use draft
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="h-px bg-white/10" />

              <div id="idea-capture" className="space-y-5">
                <SectionTitle
                  body="Save the strongest idea into your workspace so it becomes available for roadmap generation and mentor chat."
                  eyebrow="Quick capture"
                  title="Save an idea to the workspace"
                />

                <form className="space-y-4" onSubmit={handleSubmitIdea}>
                  <Input error={ideaFieldErrors.title} hint="Clear, specific titles perform better than broad buzzwords." label="Title" name="title" onChange={handleIdeaFormChange} placeholder="AI workflow copilot for small product teams" value={ideaForm.title} />
                  <Input as="textarea" error={ideaFieldErrors.description} hint="Explain the customer problem, what the product does, and why it matters now." label="Description" name="description" onChange={handleIdeaFormChange} placeholder="Describe the startup idea in practical terms so the roadmap can stay grounded." value={ideaForm.description} />
                  <Input error={ideaFieldErrors.targetAudience} hint="A clear audience helps the roadmap prioritize the right actions." label="Target audience" name="targetAudience" onChange={handleIdeaFormChange} placeholder="Solo founders, small product teams, local businesses" value={ideaForm.targetAudience} />
                  <Input error={ideaFieldErrors.budget} hint="Use a rough starting budget in USD." label="Budget" min="0" name="budget" onChange={handleIdeaFormChange} placeholder="5000" type="number" value={ideaForm.budget} />
                  <Input
                    as="select"
                    error={ideaFieldErrors.experienceLevel}
                    label="Founder experience"
                    name="experienceLevel"
                    onChange={handleIdeaFormChange}
                    options={[
                      { label: 'Beginner founder', value: 'Beginner' },
                      { label: 'Intermediate founder', value: 'Intermediate' },
                      { label: 'Advanced founder', value: 'Advanced' },
                    ]}
                    value={ideaForm.experienceLevel}
                  />

                  <Button className="w-full sm:w-auto" loading={isSubmittingIdea} size="lg" type="submit">
                    Save startup idea
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          <Card tone="default" padding="lg">
            <SectionTitle
              action={<StatusBadge tone="neutral">{ideas.length} saved</StatusBadge>}
              body="Every saved idea stays scoped to your account and becomes the source of truth for roadmap generation and mentor chat."
              eyebrow="Saved ideas"
              title="Your founder backlog"
            />

            <div className="mt-6 space-y-3">
              {isRefreshing && !ideas.length ? (
                Array.from({ length: 3 }).map((_, index) => <div className="skeleton h-28 rounded-[22px]" key={`idea-skeleton-${index}`} />)
              ) : !ideas.length ? (
                <EmptyState compact title="No ideas yet" body="Start your first startup journey by generating an idea or saving one manually in the studio above." action={<Button onClick={() => document.getElementById('idea-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} variant="secondary">Go to idea studio</Button>} />
              ) : (
                ideas.map((idea) => {
                  const isSelected = selectedIdea?.id === idea.id;

                  return (
                    <button
                      className={`w-full rounded-[24px] border p-4 text-left transition ${isSelected ? 'border-violet-300/25 bg-violet-300/12 shadow-[0_18px_40px_rgba(79,70,229,0.16)]' : 'border-white/10 bg-white/[0.03] hover:border-violet-300/18 hover:bg-white/[0.06]'}`}
                      key={idea.id}
                      onClick={() => handleSelectIdea(idea.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white">{idea.title}</h3>
                          <p className="mt-2 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-slate-400">{idea.description}</p>
                        </div>
                        {isSelected && <StatusBadge tone="info">Active</StatusBadge>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{idea.targetAudience}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{formatCurrency(idea.budget)}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{formatDate(idea.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card tone="default" padding="lg" className="overflow-hidden">
            <SectionTitle
              action={
                selectedIdea ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="neutral">{selectedIdeaRoadmaps.length} versions</StatusBadge>
                    <Button loading={activeRoadmapIdeaId === selectedIdea.id} onClick={() => handleGenerateRoadmap(selectedIdea)} size="md">
                      Generate roadmap
                    </Button>
                  </div>
                ) : null
              }
              body="This is the main execution canvas. Keep the selected idea on the left, then use the roadmap here as the source for launch planning and mentor chat."
              eyebrow="Roadmap output"
              title={selectedIdea ? selectedIdea.title : 'Choose an idea to build a roadmap'}
            />

            <div className="mt-8 space-y-6">
              {activeRoadmapIdeaId && selectedIdea && activeRoadmapIdeaId === selectedIdea.id && (
                <Loader detail="Sequencing the first practical milestones, action items, risks, tools, and timeline." messages={roadmapLoaderMessages} title="Generating roadmap..." />
              )}

              {!selectedIdea ? (
                <EmptyState title="No idea selected" body="Pick an idea from your founder backlog or save a new one first. The roadmap canvas will light up once there is a concept to work from." action={<Button onClick={() => document.getElementById('idea-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} variant="secondary">Open idea studio</Button>} />
              ) : !selectedRoadmap ? (
                <EmptyState title="No roadmap yet" body="You have a saved idea, but not an execution plan yet. Generate the first roadmap to unlock milestones, tasks, risks, tools, and mentor-ready context." action={<Button onClick={() => handleGenerateRoadmap(selectedIdea)}>Generate roadmap for {selectedIdea.title}</Button>} />
              ) : (
                <>
                  {selectedIdeaRoadmaps.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedIdeaRoadmaps.slice(0, 5).map((roadmap) => {
                        const isActive = roadmap.id === selectedRoadmap.id;

                        return (
                          <button
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${isActive ? 'border-violet-300/25 bg-violet-300/14 text-violet-50' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white'}`}
                            key={roadmap.id}
                            onClick={() => handleSelectRoadmap(roadmap.id)}
                            type="button"
                          >
                            {formatDate(roadmap.createdAt)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <Card tone="soft" padding="lg">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Roadmap summary</p>
                        <p className="mt-3 text-base leading-7 text-slate-200">{roadmapData.summary}</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-400 xl:text-right">
                        <p>Generated {formatDate(selectedRoadmap.createdAt)}</p>
                        <p>Model: {selectedRoadmap.model || 'AI model'}</p>
                      </div>
                    </div>
                  </Card>

                  <RoadmapSection emptyText="Timeline phases will appear here after the first successful roadmap run." gridClassName="md:grid-cols-3" items={Array.isArray(roadmapData.timeline) ? roadmapData.timeline : []} renderItem={(phase) => <Card key={`${phase.phase}-${phase.duration}`} padding="md" tone="soft"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/80">{phase.duration}</p><h4 className="mt-3 text-base font-semibold text-white">{phase.phase}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{phase.focus}</p></Card>} title="Timeline" />
                  <RoadmapSection emptyText="Milestones appear after roadmap generation." items={Array.isArray(roadmapData.milestones) ? roadmapData.milestones : []} renderItem={(milestone) => <Card key={`${milestone.name}-${milestone.targetPeriod}`} padding="md" tone="soft"><div className="flex items-start justify-between gap-3"><div><h4 className="text-base font-semibold text-white">{milestone.name}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{milestone.goal}</p></div><StatusBadge tone="info">{milestone.targetPeriod}</StatusBadge></div></Card>} title="Milestones" />

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <RoadmapSection emptyText="Tasks appear after roadmap generation." items={Array.isArray(roadmapData.tasks) ? roadmapData.tasks : []} renderItem={(task) => <Card key={`${task.title}-${task.priority}`} padding="md" tone="soft"><div className="flex items-start justify-between gap-3"><div><h4 className="text-base font-semibold text-white">{task.title}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{task.details}</p></div><StatusBadge tone="neutral">{task.priority}</StatusBadge></div></Card>} title="Tasks" />

                    <div className="space-y-6">
                      <RoadmapSection emptyText="Risk guidance appears after roadmap generation." gridClassName="grid-cols-1" items={Array.isArray(roadmapData.risks) ? roadmapData.risks : []} renderItem={(riskItem) => <Card key={riskItem.risk} padding="md" tone="soft"><h4 className="text-base font-semibold text-white">{riskItem.risk}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{riskItem.mitigation}</p></Card>} title="Risks" />
                      <RoadmapSection emptyText="Tool recommendations appear after roadmap generation." gridClassName="grid-cols-1" items={Array.isArray(roadmapData.tools) ? roadmapData.tools : []} renderItem={(tool) => <Card key={tool.name} padding="md" tone="soft"><h4 className="text-base font-semibold text-white">{tool.name}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{tool.reason}</p></Card>} title="Tools" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
          <Card tone="default" padding="lg">
            <SectionTitle
              action={selectedIdea ? <StatusBadge tone="info">{selectedIdea.title}</StatusBadge> : null}
              body="Ask validation, pricing, launch, or product questions. The mentor always answers using the currently selected idea and visible roadmap context."
              eyebrow="Mentor chat"
              title="Get founder-grade next-step guidance"
            />

            {!selectedIdea ? (
              <div className="mt-8">
                <EmptyState title="No idea selected for chat" body="Choose an idea from the saved backlog first. Once an idea is active, the mentor will answer with more context and better judgment." />
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {mentorSuggestions.map((suggestion) => (
                    <button
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white"
                      key={suggestion}
                      onClick={() => setChatInput(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 sm:p-5">
                  <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {chatMessages.map((message) => (
                      <ChatBubble key={message.id} message={message} />
                    ))}

                    {isSendingChat && (
                      <Loader compact className="max-w-xl" detail="The mentor is reviewing your idea, roadmap, and chat history before replying." messages={chatLoaderMessages} title="Thinking..." />
                    )}
                  </div>
                </div>

                {chatError && (
                  <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/12 p-4 text-sm leading-6 text-rose-50">
                    {chatError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleChatSubmit}>
                  <Input as="textarea" hint="Ask about MVP scope, validation, go-to-market, pricing, customers, or roadmap tradeoffs." label="Your question" onChange={(event) => setChatInput(event.target.value)} placeholder="What should I test first before I build this?" value={chatInput} />
                  <Button className="w-full sm:w-auto" loading={isSendingChat} size="lg" type="submit">
                    Ask mentor
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
