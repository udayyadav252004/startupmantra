const { buildIdeaSummary } = require('./roadmapPrompt');

function normalizeChatHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && ['user', 'assistant'].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').trim(),
    }))
    .filter((item) => item.content)
    .slice(-6);
}

function buildRoadmapContext(roadmap) {
  if (!roadmap || typeof roadmap !== 'object') {
    return '';
  }

  const summary = String(roadmap.summary || '').trim();
  const milestones = Array.isArray(roadmap.milestones)
    ? roadmap.milestones.slice(0, 3).map((item) => item.name).filter(Boolean)
    : [];

  if (!summary && milestones.length === 0) {
    return '';
  }

  return [
    `Roadmap summary: ${summary || 'Not provided'}`,
    `Key milestones: ${milestones.length ? milestones.join(', ') : 'Not provided'}`,
  ].join('\n');
}

function formatHistory(history) {
  if (!history.length) {
    return 'No previous chat messages.';
  }

  return history
    .map((message) => `${message.role === 'assistant' ? 'Mentor' : 'Founder'}: ${message.content}`)
    .join('\n');
}

function buildMentorPrompt(input) {
  const ideaSummary = buildIdeaSummary(input);
  const roadmapContext = buildRoadmapContext(input.roadmap);
  const history = normalizeChatHistory(input.history);
  const question = String(input.question || '').trim();

  return [
    'You are StartupMantra Mentor, a practical startup coach for early-stage founders.',
    'Answer the founder in a mentor-style tone: clear, calm, practical, and honest.',
    'Base your answer on the startup idea context below.',
    'Do not use hype, vague motivation, or filler.',
    'If context is missing, make a brief assumption and state it clearly.',
    'Prefer concise paragraphs and short flat bullets when they improve clarity.',
    'When useful, end with the next 2 to 4 concrete actions the founder should take.',
    'Stay focused on startup execution, validation, product, pricing, marketing, customers, and risk.',
    '',
    'Startup idea context:',
    ideaSummary || 'No startup idea context provided.',
    '',
    'Existing roadmap context:',
    roadmapContext || 'No roadmap context provided yet.',
    '',
    'Recent conversation:',
    formatHistory(history),
    '',
    'Founder question:',
    question,
  ].join('\n');
}

module.exports = {
  buildMentorPrompt,
  normalizeChatHistory,
};
