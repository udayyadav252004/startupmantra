import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Button from './Button';
import Card from './Card';
import ChatBubble from './ChatBubble';
import EmptyState from './EmptyState';
import IdeaCard from './IdeaCard';
import Input from './Input';
import Loader from './Loader';
import RoadmapCard from './RoadmapCard';
import SectionWrapper from './SectionWrapper';
import StatusBadge from './StatusBadge';
import Tabs from './Tabs';
import TimelineItem from './TimelineItem';

const ideaCategories = ['tech', 'health', 'education', 'finance', 'productivity', 'climate'];
const mentorSuggestions = [
  'What should my MVP include first?',
  'How do I validate this idea in two weeks?',
  'What are the biggest risks in my plan?',
];
const ideaLoaderMessages = [
  'Analyzing idea...',
  'Exploring better angles...',
  'Finalizing startup options...',
];
const roadmapLoaderMessages = ['Analyzing idea...', 'Designing roadmap...', 'Finalizing plan...'];
const chatLoaderMessages = [
  'Reading your startup context...',
  'Reviewing the roadmap...',
  'Drafting a clear answer...',
];
const roadmapTabs = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'risks', label: 'Risks' },
  { id: 'tools', label: 'Tools' },
];
const roadmapAccents = ['violet', 'cyan', 'emerald'];

const containerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

function scrollToElement(id) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

function normalizeRoadmapData(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function shortenText(text, maxLength = 150) {
  const normalizedText = String(text || '').trim();

  if (!normalizedText) {
    return '';
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

function getMilestoneIcon(name, index) {
  const normalized = String(name || '').toLowerCase();

  if (normalized.includes('valid') || normalized.includes('research')) return 'IV';
  if (normalized.includes('mvp') || normalized.includes('build') || normalized.includes('product')) return 'MVP';
  if (normalized.includes('launch') || normalized.includes('market') || normalized.includes('growth')) return 'GTM';
  if (normalized.includes('revenue') || normalized.includes('monet')) return 'REV';

  return String(index + 1).padStart(2, '0');
}

function RoadmapMetric({ label, value }) {
  return (
    <motion.div variants={itemMotion}>
      <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function RoadmapDetailCard({ accent = 'violet', badge, badgeTone = 'neutral', description, title, token }) {
  const accentBarClass = accent === 'rose' ? 'bg-rose-300/75' : accent === 'cyan' ? 'bg-cyan-300/75' : 'bg-violet-300/75';

  return (
    <motion.div variants={itemMotion}>
      <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/14 hover:bg-white/[0.06] hover:shadow-[0_18px_42px_rgba(2,6,23,0.16)]">
        <div className="flex items-start gap-4">
          <span className={`mt-1 h-10 w-1 rounded-full ${accentBarClass}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{token}</p>
                <h4 className="mt-2 text-base font-semibold text-white">{title}</h4>
              </div>
              {badge ? <StatusBadge tone={badgeTone}>{badge}</StatusBadge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolBadgeCard({ tool }) {
  return (
    <motion.div variants={itemMotion}>
      <div className="rounded-[18px] border border-cyan-300/16 bg-cyan-300/8 px-4 py-4 shadow-[0_14px_32px_rgba(6,182,212,0.06)] transition hover:scale-[1.02] hover:border-cyan-200/28 hover:bg-cyan-300/12">
        <span className="inline-flex rounded-full border border-cyan-300/20 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
          {tool.name}
        </span>
        <p className="mt-3 text-sm leading-6 text-slate-300">{shortenText(tool.reason, 110)}</p>
      </div>
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
  handleSubmitIdea,
  handleUseGeneratedIdea,
  ideaFieldErrors,
  ideaForm,
  ideas,
  isGeneratingIdeas,
  isGuestMode,
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
  const [activeTab, setActiveTab] = useState('tasks');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const normalizedRoadmapData = normalizeRoadmapData(roadmapData);
  const timelineItems = getItems(normalizedRoadmapData.timeline);
  const milestoneItems = getItems(normalizedRoadmapData.milestones);
  const detailData = normalizedRoadmapData?.details || normalizedRoadmapData || {};
  const contentMap = {
    tasks: getItems(detailData.tasks),
    risks: getItems(detailData.risks),
    tools: getItems(detailData.tools),
  };
  const taskItems = contentMap.tasks;
  const riskItems = contentMap.risks;
  const toolItems = contentMap.tools;
  const currentItems = contentMap[activeTab] || [];
  const roadmapSummary = String(normalizedRoadmapData.summary || '').trim();
  const summaryPreview = isSummaryExpanded ? roadmapSummary : shortenText(roadmapSummary, 240);
  const canExpandSummary = roadmapSummary.length > 240;
  const roadmapMetrics = [
    { label: 'Milestones', value: milestoneItems.length },
    { label: 'Tasks', value: taskItems.length },
    { label: 'Risks', value: riskItems.length },
    { label: 'Tools', value: toolItems.length },
  ];

  console.log('activeTab:', activeTab);
  console.log('roadmapData:', roadmapData);

  return (
    <motion.div animate="show" className="space-y-[72px] pb-16" initial="hidden" variants={containerMotion}>
      <motion.section className="space-y-6" variants={itemMotion}>
        <div className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">
          AI execution workspace
        </div>

        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Turn one startup idea into a plan you can actually execute.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Generate, choose, roadmap, then ask better founder questions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => scrollToElement('idea-studio')} size="lg">
            Start with an idea
          </Button>
          <Button onClick={() => scrollToElement('roadmap-stage')} size="lg" variant="secondary">
            Jump to roadmap
          </Button>
          <Button loading={isRefreshing} onClick={handleRefreshWorkspace} size="lg" variant="ghost">
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={authUser ? 'info' : 'neutral'}>{authUser ? authUser.email : 'Guest mode'}</StatusBadge>
          <StatusBadge tone={backendOnline ? 'success' : 'warning'}>
            {backendOnline ? 'Workspace connected' : backendStatus}
          </StatusBadge>
          {selectedIdea ? <StatusBadge tone="neutral">{selectedIdea.title}</StatusBadge> : null}
        </div>

        {dashboardError ? (
          <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/12 p-4 text-sm leading-6 text-amber-50">
            {dashboardError}
          </div>
        ) : null}
      </motion.section>

      <SectionWrapper
        contentClassName="space-y-6"
        icon="ID"
        subtitle="Start with a category, get sharper startup directions, then save one grounded draft."
        title="Idea Generation"
        tone="light"
      >
        <Card className="rounded-[22px] border-white/12" id="idea-studio" padding="lg" tone="light">
          <form className="space-y-5" onSubmit={handleIdeaGeneratorSubmit}>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Start</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white">Generate better startup angles</h3>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">Choose a category and keep the strongest idea only.</p>
            </div>

            <Input
              label="Category"
              onChange={(event) => setGeneratorCategory(event.target.value)}
              placeholder="tech, health, education"
              value={generatorCategory}
            />

            <div className="flex flex-wrap gap-2">
              {ideaCategories.map((category) => (
                <button
                  className={`rounded-full border px-3 py-2 text-sm font-medium capitalize transition ${
                    generatorCategory === category
                      ? 'border-violet-300/24 bg-violet-300/14 text-violet-50'
                      : 'border-slate-300/12 bg-white/50 text-slate-300 hover:border-violet-300/18 hover:bg-white/70 hover:text-white'
                  }`}
                  key={category}
                  onClick={() => setGeneratorCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>

            <Button className="w-full sm:w-auto" loading={isGeneratingIdeas} size="lg" type="submit">
              Generate ideas
            </Button>
          </form>
        </Card>

        <AnimatePresence mode="wait">
          {isGeneratingIdeas ? (
            <Loader
              detail="Turning your category into a few stronger startup directions."
              key="idea-loader"
              messages={ideaLoaderMessages}
              title="Generating ideas"
            />
          ) : !generatedIdeas.length ? (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} key="ideas-empty" transition={{ duration: 0.2, ease: 'easeOut' }}>
              <EmptyState compact title="No generated ideas yet" body="Start with a category and the AI will draft a few options." />
            </motion.div>
          ) : (
            <motion.div className="grid gap-4 md:grid-cols-2" key="ideas-list" variants={containerMotion}>
              {generatedIdeas.map((idea, index) => (
                <IdeaCard
                  action={
                    <Button onClick={() => handleUseGeneratedIdea(idea)} size="sm" variant="secondary">
                      Use draft
                    </Button>
                  }
                  description={shortenText(idea.explanation, 140)}
                  eyebrow={`Draft ${String(index + 1).padStart(2, '0')}`}
                  key={`${idea.title}-${index}`}
                  title={idea.title}
                  variant="generated"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="rounded-[22px] border-white/10" id="idea-capture" padding="md" tone="subtle">
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">Save</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Capture the chosen idea</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Keep the draft realistic so the roadmap stays useful.</p>
              </div>
              {isGuestMode ? (
                <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/12 p-4 text-sm leading-6 text-amber-50">
                  Your work is temporary until saved.
                </div>
              ) : null}
            </div>

            <form className="space-y-4" onSubmit={handleSubmitIdea}>
              <Input error={ideaFieldErrors.title} label="Title" name="title" onChange={handleIdeaFormChange} placeholder="AI workflow copilot for small product teams" value={ideaForm.title} />
              <Input as="textarea" error={ideaFieldErrors.description} label="Description" name="description" onChange={handleIdeaFormChange} placeholder="Describe the customer problem, the product, and why it matters now." value={ideaForm.description} />
              <Input error={ideaFieldErrors.targetAudience} label="Target audience" name="targetAudience" onChange={handleIdeaFormChange} placeholder="Solo founders, product teams, local businesses" value={ideaForm.targetAudience} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input error={ideaFieldErrors.budget} label="Budget" min="0" name="budget" onChange={handleIdeaFormChange} placeholder="5000" type="number" value={ideaForm.budget} />
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
        </Card>
      </SectionWrapper>

      <SectionWrapper
        action={<StatusBadge tone="neutral">{ideas.length} saved</StatusBadge>}
        contentClassName="space-y-6"
        icon="SV"
        subtitle="Keep saved ideas small and scannable so selecting the next roadmap stays easy."
        title="Saved Ideas"
        tone="bordered"
      >
        <AnimatePresence mode="wait">
          {isRefreshing && !ideas.length ? (
            <motion.div className="grid gap-4 md:grid-cols-2" key="saved-loading">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="skeleton h-32 rounded-[18px]" key={`saved-skeleton-${index}`} />
              ))}
            </motion.div>
          ) : !ideas.length ? (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} key="saved-empty" transition={{ duration: 0.2, ease: 'easeOut' }}>
              <EmptyState compact title="No saved ideas yet" body={isGuestMode ? "You can keep exploring as a guest. Log in when you want ideas to stay with your account." : "Save your first idea above, then come here to choose the active one."} />
            </motion.div>
          ) : (
            <motion.div className="grid gap-4 md:grid-cols-2" key="saved-list" variants={containerMotion}>
              {ideas.map((idea) => (
                <IdeaCard
                  active={selectedIdea?.id === idea.id}
                  badges={[idea.targetAudience, formatCurrency(idea.budget), formatDate(idea.createdAt)]}
                  description={shortenText(idea.description, 118)}
                  interactive
                  key={idea.id}
                  onClick={() => handleSelectIdea(idea.id)}
                  title={idea.title}
                  variant="saved"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </SectionWrapper>

      <SectionWrapper
        action={
          selectedIdea ? (
            <>
              <StatusBadge tone="neutral">{selectedIdeaRoadmaps.length} versions</StatusBadge>
              <Button loading={activeRoadmapIdeaId === selectedIdea.id} onClick={() => handleGenerateRoadmap(selectedIdea)} size="md">
                Generate roadmap
              </Button>
            </>
          ) : null
        }
        className="shadow-[0_36px_90px_rgba(49,46,129,0.28)]"
        contentClassName="space-y-6"
        icon="RM"
        id="roadmap-stage"
        padding="lg"
        subtitle="This is the product payoff: one clear execution plan with milestones first, then detail tabs."
        title={selectedIdea ? `Roadmap for ${selectedIdea.title}` : 'Roadmap'}
        tone="hero"
      >
        <AnimatePresence mode="wait">
          {activeRoadmapIdeaId && selectedIdea && activeRoadmapIdeaId === selectedIdea.id ? (
            <Loader
              detail="Turning the selected idea into milestones, tasks, risks, tools, and timing."
              key="roadmap-loader"
              messages={roadmapLoaderMessages}
              title="Generating roadmap"
            />
          ) : !selectedIdea ? (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} key="roadmap-no-idea" transition={{ duration: 0.2, ease: 'easeOut' }}>
              <EmptyState title="No idea selected" body={isGuestMode ? "Start a draft above, then generate the roadmap here without logging in." : "Choose a saved idea above, then generate the roadmap here."} />
            </motion.div>
          ) : !selectedRoadmap ? (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} key="roadmap-empty" transition={{ duration: 0.2, ease: 'easeOut' }}>
              <EmptyState
                action={<Button onClick={() => handleGenerateRoadmap(selectedIdea)}>Generate roadmap</Button>}
                body={isGuestMode ? "You have the draft. Generate the roadmap now, then log in later if you want to save it." : "You have the idea. Generate the roadmap to unlock the product's main value."}
                title="No roadmap yet"
              />
            </motion.div>
          ) : (
            <motion.div className="space-y-6" key={selectedRoadmap.id} variants={containerMotion}>
              {selectedIdeaRoadmaps.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedIdeaRoadmaps.slice(0, 6).map((roadmap) => {
                    const isActive = roadmap.id === selectedRoadmap.id;

                    return (
                      <button
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-violet-300/24 bg-violet-300/14 text-violet-50'
                            : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white'
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

              <Card className="rounded-[22px] border-violet-300/16" padding="lg" tone="roadmap">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">Outcome</p>
                    <h3 className="text-2xl font-semibold tracking-tight text-white">Execution summary</h3>
                    <p className="max-w-3xl text-sm leading-6 text-slate-300">{summaryPreview || 'No summary available yet.'}</p>
                    {canExpandSummary ? (
                      <button
                        className="text-sm font-medium text-violet-100 transition hover:text-white"
                        onClick={() => setIsSummaryExpanded((current) => !current)}
                        type="button"
                      >
                        {isSummaryExpanded ? 'Show less' : 'Show more'}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedIdea.targetAudience ? <StatusBadge tone="info">{selectedIdea.targetAudience}</StatusBadge> : null}
                    {selectedIdea.budget !== undefined && selectedIdea.budget !== null && selectedIdea.budget !== '' ? <StatusBadge tone="neutral">{formatCurrency(selectedIdea.budget)}</StatusBadge> : null}
                    {selectedIdea.experienceLevel ? <StatusBadge tone="neutral">{selectedIdea.experienceLevel}</StatusBadge> : null}
                    <StatusBadge tone="neutral">{formatDate(selectedRoadmap.createdAt)}</StatusBadge>
                    <StatusBadge tone="neutral">{selectedRoadmap.model || (selectedRoadmap.isTemporary ? 'Temporary session' : 'AI planner')}</StatusBadge>
                  </div>

                  <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={containerMotion}>
                    {roadmapMetrics.map((metric) => (
                      <RoadmapMetric key={metric.label} label={metric.label} value={metric.value} />
                    ))}
                  </motion.div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">Milestones</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Execution steps</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Read the plan in order before switching into detail mode.</p>
                </div>

                {milestoneItems.length ? (
                  <div className="space-y-4">
                    {milestoneItems.map((milestone, index) => (
                      <RoadmapCard
                        accent={roadmapAccents[index % roadmapAccents.length]}
                        icon={getMilestoneIcon(milestone.name, index)}
                        index={index + 1}
                        key={`${milestone.name}-${milestone.targetPeriod}`}
                        meta={milestone.targetPeriod}
                        summary={shortenText(milestone.goal, 150)}
                        title={milestone.name}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact title="No milestones yet" body="Generate a roadmap to unlock the milestone sequence." />
                )}
              </div>

              {timelineItems.length ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Flow</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Launch phases</h3>
                  </div>

                  <div className="space-y-4">
                    {timelineItems.map((phase, index) => (
                      <TimelineItem
                        description={shortenText(phase.focus, 120)}
                        index={index}
                        isLast={index === timelineItems.length - 1}
                        key={`${phase.phase}-${phase.duration}`}
                        meta={phase.duration}
                        points={[]}
                        title={phase.phase}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Details</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Tasks, risks, and tools</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Switch focus without losing the roadmap context above.</p>
                </div>

                <Tabs items={roadmapTabs} onChange={setActiveTab} value={activeTab} />

                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={activeTab === 'tools' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}
                    initial={{ opacity: 0, y: 10 }}
                    key={activeTab}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {currentItems.length === 0 ? (
                      <p className={activeTab === 'tools' ? 'text-gray-400 md:col-span-2' : 'text-gray-400'}>No data available</p>
                    ) : (
                      currentItems.map((item, index) => {
                        if (activeTab === 'tools') {
                          const normalizedTool =
                            typeof item === 'string'
                              ? { name: item, reason: item }
                              : {
                                  name: item?.name || item?.title || `Tool ${index + 1}`,
                                  reason: item?.reason || item?.description || JSON.stringify(item),
                                };

                          return <ToolBadgeCard key={`${normalizedTool.name}-${index}`} tool={normalizedTool} />;
                        }

                        const title =
                          typeof item === 'string'
                            ? item
                            : activeTab === 'risks'
                              ? item?.risk || item?.title || `Risk ${index + 1}`
                              : item?.title || item?.name || `Task ${index + 1}`;

                        const description =
                          typeof item === 'string'
                            ? item
                            : activeTab === 'risks'
                              ? item?.mitigation || item?.description || JSON.stringify(item)
                              : item?.details || item?.description || JSON.stringify(item);

                        return (
                          <RoadmapDetailCard
                            accent={activeTab === 'risks' ? 'rose' : 'violet'}
                            badge={activeTab === 'risks' ? 'Mitigate' : typeof item === 'object' && item !== null ? item.priority : undefined}
                            badgeTone={activeTab === 'risks' ? 'warning' : 'neutral'}
                            description={shortenText(description, 160)}
                            key={`${title}-${index}`}
                            title={title}
                            token={activeTab === 'risks' ? 'Risk' : 'Task'}
                          />
                        );
                      })
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionWrapper>

      <SectionWrapper
        contentClassName="space-y-6"
        icon="AI"
        subtitle="Ask about next steps, tradeoffs, validation, or launch decisions with the roadmap context in mind."
        title="Mentor Chat"
        tone="subtle"
      >
        {!selectedIdea ? (
          <EmptyState title="No idea selected" body={isGuestMode ? "Start a draft or generate a roadmap first, then ask the mentor your next question." : "Choose an idea and generate the roadmap before opening mentor chat."} />
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Conversation</p>
              <h3 className="text-lg font-semibold text-white">Ask a focused question</h3>
              <p className="text-sm leading-6 text-slate-400">Keep questions short and founder-specific.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {mentorSuggestions.map((suggestion) => (
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                  key={suggestion}
                  onClick={() => setChatInput(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-slate-950/55 p-4 sm:p-5">
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
              <div className="rounded-[18px] border border-rose-400/20 bg-rose-400/12 p-4 text-sm leading-6 text-rose-50">
                {chatError}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleChatSubmit}>
              <Input
                as="textarea"
                label="Your question"
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="What should I validate before I build this?"
                value={chatInput}
              />
              <Button className="w-full sm:w-auto" loading={isSendingChat} size="lg" type="submit">
                Ask mentor
              </Button>
            </form>
          </>
        )}
      </SectionWrapper>
    </motion.div>
  );
}

