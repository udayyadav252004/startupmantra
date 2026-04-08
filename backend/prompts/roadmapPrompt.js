function buildIdeaSummary(input) {
  const ideaText = String(input.idea || '').trim();
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const targetAudience = String(input.targetAudience || '').trim();
  const budget = input.budget === undefined || input.budget === null ? '' : String(input.budget).trim();
  const experienceLevel = String(input.experienceLevel || '').trim();

  if (ideaText) {
    return ideaText;
  }

  if (!title && !description) {
    return '';
  }

  return [
    `Title: ${title || 'Not provided'}`,
    `Description: ${description || 'Not provided'}`,
    `Target audience: ${targetAudience || 'Not provided'}`,
    `Budget: ${budget || 'Not provided'}`,
    `Experience level: ${experienceLevel || 'Not provided'}`,
  ].join('\n');
}

function buildRoadmapPrompt(ideaSummary) {
  return [
    'You are an experienced startup strategist and product execution advisor.',
    'Create a practical startup roadmap based on the idea provided below.',
    'Return valid JSON only.',
    'Do not include markdown, code fences, or any explanation outside the JSON object.',
    'Keep the roadmap beginner-friendly, realistic, and action-oriented.',
    'Avoid vague advice and do not invent facts that are not supported by the idea.',
    'Prefer concise wording and specific actions.',
    '',
    'Use this exact JSON shape:',
    '{',
    '  "summary": "string",',
    '  "timeline": [{ "phase": "string", "duration": "string", "focus": "string" }],',
    '  "milestones": [{ "name": "string", "goal": "string", "targetPeriod": "string" }],',
    '  "tasks": [{ "title": "string", "details": "string", "priority": "high|medium|low" }],',
    '  "risks": [{ "risk": "string", "mitigation": "string" }],',
    '  "tools": [{ "name": "string", "reason": "string" }]',
    '}',
    '',
    'Output requirements:',
    '- Include a short summary of the startup direction.',
    '- Include 4 to 6 milestones.',
    '- Include 6 to 10 concrete tasks.',
    '- Include 3 to 5 major risks, each with a mitigation.',
    '- Include 4 to 6 tools with a short reason for each.',
    '- Include a clear timeline broken into phases.',
    '',
    'Startup idea:',
    ideaSummary,
  ].join('\n');
}

module.exports = {
  buildIdeaSummary,
  buildRoadmapPrompt,
};
