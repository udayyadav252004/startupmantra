import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Button from './Button';
import Card from './Card';
import ChatBubble from './ChatBubble';
import EmptyState from './EmptyState';
import Input from './Input';
import Loader from './Loader';
import SectionTitle from './SectionTitle';
import StatusBadge from './StatusBadge';
import TimelineItem from './TimelineItem';

const ideaCategories = ['tech', 'health', 'education', 'finance', 'productivity', 'climate'];
const mentorSuggestions = [
  'What should my MVP include first?',
  'How do I validate this idea in two weeks?',
  'What are the biggest risks in my plan?',
];
const workspaceSteps = [
  { label: 'Generate', caption: 'Find a sharper angle' },
  { label: 'Capture', caption: 'Save one clear draft' },
  { label: 'Roadmap', caption: 'Turn it into milestones' },
  { label: 'Mentor', caption: 'Pressure-test next steps' },
];
const ideaLoaderMessages = [
  'Scanning adjacent opportunities',
  'Comparing founder-friendly wedges',
  'Drafting stronger startup concepts',
];
const roadmapLoaderMessages = [
  'Analyzing the idea',
  'Building roadmap blocks',
  'Finalizing launch priorities',
];
const chatLoaderMessages = [
  'Reading your startup context',
  'Thinking like a practical mentor',
  'Drafting a sharper answer',
];
const roadmapTabs = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'risks', label: 'Risks' },
  { id: 'tools', label: 'Tools' },
];

const pageMotion = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
};

const itemMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: 'easeOut' } },
};

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

function getItems(value) {
  return Array.isArray(value) ? value : [];
}

function shortenText(text, maxLength = 160) {
  const normalizedText = String(text || '').trim();

  if (!normalizedText) {
    return '';
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

function MetricTile({ label, value }) {
  return (
    <motion.div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4" variants={itemMotion}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </motion.div>
  );
}

function PhaseCard({ phase }) {
  return (
    <motion.div variants={itemMotion}>
      <Card padding="md" tone="soft" className="h-full">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{phase.duration}</p>
        <h4 className="mt-2 text-base font-semibold text-white">{phase.phase}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-400">{shortenText(phase.focus, 90)}</p>
      </Card>
    </motion.div>
  );
}

function GeneratedIdeaCard({ idea, index, onUse }) {
  return (
    <motion.div variants={itemMotion}>
      <Card padding="md" tone="soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
              Idea {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-2 text-base font-semibold text-white">{idea.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{shortenText(idea.explanation, 140)}</p>
          </div>
          <Button onClick={() => onUse(idea)} size="sm" variant="secondary">
            Use draft
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function SavedIdeaCard({ idea, isSelected, onSelect }) {
  return (
    <motion.button
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        isSelected
          ? 'border-violet-300/25 bg-violet-300/12 shadow-[0_18px_40px_rgba(79,70,229,0.16)]'
          : 'border-white/10 bg-white/[0.03] hover:border-violet-300/18 hover:bg-white/[0.06]'
      }`}
      onClick={() => onSelect(idea.id)}
      type="button"
      variants={itemMotion}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-violet-200' : 'bg-slate-500'}`} />
            <h3 className="truncate text-base font-semibold text-white">{idea.title}</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{shortenText(idea.description, 120)}</p>
        </div>
        {isSelected ? <StatusBadge tone="info">Active</StatusBadge> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{idea.targetAudience}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{formatCurrency(idea.budget)}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{formatDate(idea.createdAt)}</span>
      </div>
    </motion.button>
  );
}

function RoadmapDetailCard({ badge, badgeTone = 'neutral', description, title, token }) {
  return (
    <motion.div variants={itemMotion}>
      <Card padding="md" tone="soft" className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{token}</p>
            <h4 className="mt-2 text-base font-semibold text-white">{title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          {badge ? <StatusBadge tone={badgeTone}>{badge}</StatusBadge> : null}
        </div>
      </Card>
    </motion.div>
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
  const [roadmapTab, setRoadmapTab] = useState('tasks');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const timelineItems = getItems(roadmapData.timeline);
  const milestoneItems = getItems(roadmapData.milestones);
  const taskItems = getItems(roadmapData.tasks);
  const riskItems = getItems(roadmapData.risks);
  const toolItems = getItems(roadmapData.tools);
  const roadmapSummary = String(roadmapData.summary || '').trim();
  const summaryPreview = isSummaryExpanded ? roadmapSummary : shortenText(roadmapSummary, 220);
  const canExpandSummary = roadmapSummary.length > 220;
  const roadmapMetrics = [
    { label: 'Milestones', value: milestoneItems.length },
    { label: 'Tasks', value: taskItems.length },
    { label: 'Risks', value: riskItems.length },
    { label: 'Tools', value: toolItems.length },
  ];

  return (
    <motion.div animate="show" className="space-y-6 pb-10" initial="hidden" variants={pageMotion}>
      <motion.div variants={itemMotion}>
        <Card tone="hero" padding="lg" className="noise-overlay overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.12),transparent_50%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Founder workspace</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Welcome back, {authUser.name}.
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                  Generate, save, plan, and pressure-test one idea at a time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="info">{authUser.email}</StatusBadge>
                <StatusBadge tone={backendOnline ? 'success' : 'warning'}>
                  {backendOnline ? 'Workspace connected' : backendStatus}
                </StatusBadge>
                <Button loading={isRefreshing} onClick={handleRefreshWorkspace} size="sm" variant="secondary">
                  Refresh
                </Button>
                <Button onClick={handleSignOut} size="sm" variant="ghost">
                  Sign out
                </Button>
              </div>
            </div>

            {dashboardError ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/12 p-4 text-sm leading-6 text-amber-50">
                {dashboardError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workspaceSteps.map((step, index) => (
                <motion.div key={step.label} variants={itemMotion}>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-violet-300/16 bg-violet-300/12 text-sm font-semibold text-violet-50">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{step.label}</p>
                        <p className="text-xs text-slate-400">{step.caption}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <motion.div variants={itemMotion}>
            <Card id="idea-studio" tone="default" padding="lg" className="overflow-hidden">
              <SectionTitle
                action={<StatusBadge tone="neutral">{generatedIdeas.length} generated</StatusBadge>}
                body="Generate or save one clear concept."
                eyebrow="Idea studio"
                title="Shape the next idea"
              />

              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <SectionTitle
                    compact
                    body="Start with a category. Keep only the strongest draft."
                    eyebrow="AI explore"
                    title="Generate ideas"
                  />

                  <form className="mt-5 space-y-4" onSubmit={handleIdeaGeneratorSubmit}>
                    <div className="flex flex-wrap gap-2">
                      {ideaCategories.map((category) => (
                        <button
                          className={`rounded-full border px-3 py-2 text-sm font-medium capitalize transition ${
                            generatorCategory === category
                              ? 'border-violet-300/25 bg-violet-300/14 text-violet-50'
                              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white'
                          }`}
                          key={category}
                          onClick={() => setGeneratorCategory(category)}
                          type="button"
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <Input
                      label="Category"
                      onChange={(event) => setGeneratorCategory(event.target.value)}
                      placeholder="tech, health, education"
                      value={generatorCategory}
                    />

                    <Button className="w-full sm:w-auto" loading={isGeneratingIdeas} size="lg" type="submit">
                      Generate ideas
                    </Button>
                  </form>
                </div>

                <AnimatePresence mode="wait">
                  {isGeneratingIdeas ? (
                    <Loader
                      detail="Looking for sharper startup directions with better wedges and clearer founder fit."
                      key="idea-loader"
                      messages={ideaLoaderMessages}
                      title="Generating ideas"
                    />
                  ) : !generatedIdeas.length ? (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 10 }}
                      key="idea-empty"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <EmptyState compact title="No ideas yet" body="Pick a category and let the AI suggest a few strong directions." />
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-3" key="idea-results" variants={pageMotion}>
                      {generatedIdeas.map((idea, index) => (
                        <GeneratedIdeaCard idea={idea} index={index} key={`${idea.title}-${index}`} onUse={handleUseGeneratedIdea} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" id="idea-capture">
                  <SectionTitle
                    compact
                    body="Save the strongest concept to unlock roadmap and mentor context."
                    eyebrow="Private draft"
                    title="Capture idea"
                  />

                  <form className="mt-5 space-y-4" onSubmit={handleSubmitIdea}>
                    <Input
                      error={ideaFieldErrors.title}
                      label="Title"
                      name="title"
                      onChange={handleIdeaFormChange}
                      placeholder="AI workflow copilot for small product teams"
                      value={ideaForm.title}
                    />
                    <Input
                      as="textarea"
                      error={ideaFieldErrors.description}
                      label="Description"
                      name="description"
                      onChange={handleIdeaFormChange}
                      placeholder="Describe the customer problem, the product, and why it matters now."
                      value={ideaForm.description}
                    />
                    <Input
                      error={ideaFieldErrors.targetAudience}
                      label="Target audience"
                      name="targetAudience"
                      onChange={handleIdeaFormChange}
                      placeholder="Solo founders, product teams, local businesses"
                      value={ideaForm.targetAudience}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        error={ideaFieldErrors.budget}
                        label="Budget"
                        min="0"
                        name="budget"
                        onChange={handleIdeaFormChange}
                        placeholder="5000"
                        type="number"
                        value={ideaForm.budget}
                      />
                      <Input
                        as="select"
                        error={ideaFieldErrors.experienceLevel}
                        label="Founder level"
                        name="experienceLevel"
                        onChange={handleIdeaFormChange}
                        options={[
                          { label: 'Beginner founder', value: 'Beginner' },
                          { label: 'Intermediate founder', value: 'Intermediate' },
                          { label: 'Advanced founder', value: 'Advanced' },
                        ]}
                        value={ideaForm.experienceLevel}
                      />
                    </div>

                    <Button className="w-full sm:w-auto" loading={isSubmittingIdea} size="lg" type="submit">
                      Save idea
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemMotion}>
            <Card tone="default" padding="lg">
              <SectionTitle
                action={<StatusBadge tone="neutral">{ideas.length} saved</StatusBadge>}
                body="Your private founder backlog."
                eyebrow="Saved ideas"
                title="Backlog"
              />

              <AnimatePresence mode="wait">
                {isRefreshing && !ideas.length ? (
                  <motion.div className="mt-6 space-y-3" key="ideas-loading">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div className="skeleton h-28 rounded-[22px]" key={`idea-skeleton-${index}`} />
                    ))}
                  </motion.div>
                ) : !ideas.length ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                    initial={{ opacity: 0, y: 10 }}
                    key="ideas-empty"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <EmptyState
                      compact
                      action={
                        <Button
                          onClick={() => document.getElementById('idea-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          variant="secondary"
                        >
                          Open idea studio
                        </Button>
                      }
                      body="Start with one idea. The roadmap will follow."
                      title="No ideas saved"
                    />
                  </motion.div>
                ) : (
                  <motion.div className="mt-6 space-y-3" key="ideas-list" variants={pageMotion}>
                    {ideas.map((idea) => (
                      <SavedIdeaCard
                        idea={idea}
                        isSelected={selectedIdea?.id === idea.id}
                        key={idea.id}
                        onSelect={handleSelectIdea}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>

        <div className="xl:col-span-8">
          <motion.div variants={itemMotion}>
            <Card tone="default" padding="lg" className="overflow-hidden">
              <SectionTitle
                action={
                  selectedIdea ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge tone="neutral">{selectedIdeaRoadmaps.length} versions</StatusBadge>
                      <Button
                        loading={activeRoadmapIdeaId === selectedIdea.id}
                        onClick={() => handleGenerateRoadmap(selectedIdea)}
                        size="md"
                      >
                        Generate roadmap
                      </Button>
                    </div>
                  ) : null
                }
                body="The roadmap is the main canvas. Keep it focused."
                eyebrow="Roadmap output"
                title={selectedIdea ? selectedIdea.title : 'Choose an idea to build the roadmap'}
              />

              <div className="mt-6 space-y-6">
                <AnimatePresence mode="wait">
                  {activeRoadmapIdeaId && selectedIdea && activeRoadmapIdeaId === selectedIdea.id ? (
                    <Loader
                      detail="Sequencing milestones, tasks, risks, tools, and timing into a cleaner launch plan."
                      key="roadmap-loader"
                      messages={roadmapLoaderMessages}
                      title="Generating roadmap"
                    />
                  ) : !selectedIdea ? (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 10 }}
                      key="roadmap-no-idea"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <EmptyState
                        action={
                          <Button
                            onClick={() => document.getElementById('idea-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            variant="secondary"
                          >
                            Open idea studio
                          </Button>
                        }
                        body="Pick or save an idea first."
                        title="No idea selected"
                      />
                    </motion.div>
                  ) : !selectedRoadmap ? (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 10 }}
                      key="roadmap-empty"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <EmptyState
                        action={<Button onClick={() => handleGenerateRoadmap(selectedIdea)}>Generate roadmap</Button>}
                        body="You have the idea. Generate the plan next."
                        title="No roadmap yet"
                      />
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-6" key={selectedRoadmap.id} variants={pageMotion}>
                      {selectedIdeaRoadmaps.length > 1 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedIdeaRoadmaps.slice(0, 6).map((roadmap) => {
                            const isActive = roadmap.id === selectedRoadmap.id;

                            return (
                              <button
                                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                                  isActive
                                    ? 'border-violet-300/25 bg-violet-300/14 text-violet-50'
                                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white'
                                }`}
                                key={roadmap.id}
                                onClick={() => handleSelectRoadmap(roadmap.id)}
                                type="button"
                              >
                                {formatDate(roadmap.createdAt)}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      <Card tone="hero" padding="lg" className="overflow-hidden">
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.2),transparent_56%)]" />
                        <div className="relative space-y-6">
                          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-200/80">
                                Execution summary
                              </p>
                              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                Roadmap for {selectedIdea.title}
                              </h3>
                              <p className="mt-3 text-sm leading-7 text-slate-200">{summaryPreview || 'No summary available yet.'}</p>
                              {canExpandSummary ? (
                                <button
                                  className="mt-3 text-sm font-medium text-violet-100 transition hover:text-white"
                                  onClick={() => setIsSummaryExpanded((current) => !current)}
                                  type="button"
                                >
                                  {isSummaryExpanded ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">
                              <StatusBadge tone="info">{selectedIdea.targetAudience}</StatusBadge>
                              <StatusBadge tone="neutral">{formatCurrency(selectedIdea.budget)}</StatusBadge>
                              <StatusBadge tone="neutral">{selectedIdea.experienceLevel}</StatusBadge>
                              <StatusBadge tone="neutral">{formatDate(selectedRoadmap.createdAt)}</StatusBadge>
                              <StatusBadge tone="neutral">{selectedRoadmap.model || 'AI planner'}</StatusBadge>
                            </div>
                          </div>

                          <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={pageMotion}>
                            {roadmapMetrics.map((metric) => (
                              <MetricTile key={metric.label} label={metric.label} value={metric.value} />
                            ))}
                          </motion.div>
                        </div>
                      </Card>

                      {timelineItems.length ? (
                        <div className="space-y-4">
                          <SectionTitle
                            compact
                            body="Phase view for the roadmap."
                            eyebrow="Timeline"
                            title="Launch phases"
                          />
                          <motion.div className="grid gap-3 md:grid-cols-3" variants={pageMotion}>
                            {timelineItems.map((phase) => (
                              <PhaseCard key={`${phase.phase}-${phase.duration}`} phase={phase} />
                            ))}
                          </motion.div>
                        </div>
                      ) : null}

                      <div className="space-y-4">
                        <SectionTitle
                          compact
                          body="Read the plan like a sequence, not a wall of text."
                          eyebrow="Milestones"
                          title="Execution path"
                        />

                        {milestoneItems.length ? (
                          <div className="space-y-4">
                            {milestoneItems.map((milestone, index) => (
                              <TimelineItem
                                description={shortenText(milestone.goal, 150)}
                                index={index}
                                isLast={index === milestoneItems.length - 1}
                                key={`${milestone.name}-${milestone.targetPeriod}`}
                                meta={milestone.targetPeriod}
                                points={timelineItems[index]?.focus ? [shortenText(timelineItems[index].focus, 60)] : []}
                                title={milestone.name}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyState compact title="No milestones yet" body="Generate a roadmap to unlock the milestone sequence." />
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <SectionTitle
                            compact
                            body="Open one layer at a time."
                            eyebrow="Details"
                            title="Tasks, risks, and tools"
                          />
                          <div className="flex flex-wrap gap-2">
                            {roadmapTabs.map((tab) => {
                              const count =
                                tab.id === 'tasks'
                                  ? taskItems.length
                                  : tab.id === 'risks'
                                    ? riskItems.length
                                    : toolItems.length;

                              return (
                                <button
                                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                                    roadmapTab === tab.id
                                      ? 'border-violet-300/25 bg-violet-300/14 text-violet-50'
                                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white'
                                  }`}
                                  key={tab.id}
                                  onClick={() => setRoadmapTab(tab.id)}
                                  type="button"
                                >
                                  {tab.label} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {roadmapTab === 'tasks' ? (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="grid gap-4 md:grid-cols-2"
                              initial={{ opacity: 0, y: 12 }}
                              key="tasks"
                              transition={{ duration: 0.24, ease: 'easeOut' }}
                            >
                              {taskItems.length ? (
                                taskItems.map((task) => (
                                  <RoadmapDetailCard
                                    badge={task.priority}
                                    description={shortenText(task.details, 140)}
                                    key={`${task.title}-${task.priority}`}
                                    title={task.title}
                                    token="Task"
                                  />
                                ))
                              ) : (
                                <div className="md:col-span-2">
                                  <EmptyState compact title="No tasks yet" body="Tasks will appear here after roadmap generation." />
                                </div>
                              )}
                            </motion.div>
                          ) : null}

                          {roadmapTab === 'risks' ? (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="grid gap-4 md:grid-cols-2"
                              initial={{ opacity: 0, y: 12 }}
                              key="risks"
                              transition={{ duration: 0.24, ease: 'easeOut' }}
                            >
                              {riskItems.length ? (
                                riskItems.map((riskItem) => (
                                  <RoadmapDetailCard
                                    badge="Mitigate"
                                    badgeTone="warning"
                                    description={shortenText(riskItem.mitigation, 140)}
                                    key={riskItem.risk}
                                    title={riskItem.risk}
                                    token="Risk"
                                  />
                                ))
                              ) : (
                                <div className="md:col-span-2">
                                  <EmptyState compact title="No risks yet" body="Risk guidance will appear here after roadmap generation." />
                                </div>
                              )}
                            </motion.div>
                          ) : null}

                          {roadmapTab === 'tools' ? (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="grid gap-4 md:grid-cols-2"
                              initial={{ opacity: 0, y: 12 }}
                              key="tools"
                              transition={{ duration: 0.24, ease: 'easeOut' }}
                            >
                              {toolItems.length ? (
                                toolItems.map((tool) => (
                                  <RoadmapDetailCard
                                    badge="Recommended"
                                    badgeTone="info"
                                    description={shortenText(tool.reason, 140)}
                                    key={tool.name}
                                    title={tool.name}
                                    token="Tool"
                                  />
                                ))
                              ) : (
                                <div className="md:col-span-2">
                                  <EmptyState compact title="No tools yet" body="Tool recommendations will appear here after roadmap generation." />
                                </div>
                              )}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="xl:col-span-12">
          <motion.div variants={itemMotion}>
            <Card tone="default" padding="lg">
              <SectionTitle
                action={selectedIdea ? <StatusBadge tone="info">{selectedIdea.title}</StatusBadge> : null}
                body="Short, context-aware answers for your active idea."
                eyebrow="Mentor chat"
                title="Ask the mentor"
              />

              {!selectedIdea ? (
                <div className="mt-6">
                  <EmptyState title="No idea selected" body="Choose an idea from the backlog before starting mentor chat." />
                </div>
              ) : (
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Quick prompts</p>
                    <div className="flex flex-wrap gap-2 xl:flex-col xl:items-stretch">
                      {mentorSuggestions.map((suggestion) => (
                        <button
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-sm text-slate-300 transition hover:border-violet-300/20 hover:bg-white/[0.08] hover:text-white"
                          key={suggestion}
                          onClick={() => setChatInput(suggestion)}
                          type="button"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 sm:p-5">
                      <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                        {chatMessages.map((message) => (
                          <ChatBubble key={message.id} message={message} />
                        ))}

                        {isSendingChat ? (
                          <Loader
                            compact
                            className="max-w-xl"
                            detail="The mentor is reviewing your idea, roadmap, and recent chat."
                            messages={chatLoaderMessages}
                            title="Thinking"
                          />
                        ) : null}
                      </div>
                    </div>

                    {chatError ? (
                      <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/12 p-4 text-sm leading-6 text-rose-50">
                        {chatError}
                      </div>
                    ) : null}

                    <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" onSubmit={handleChatSubmit}>
                      <Input
                        as="textarea"
                        label="Your question"
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder="What should I validate before I build this?"
                        value={chatInput}
                      />
                      <Button className="w-full lg:w-auto" loading={isSendingChat} size="lg" type="submit">
                        Ask mentor
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
