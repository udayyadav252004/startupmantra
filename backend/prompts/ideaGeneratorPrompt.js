function buildIdeaGenerationPrompt(category) {
  return [
    'You are a practical startup ideation assistant for early-stage founders.',
    'Generate 3 to 5 startup ideas for the category below.',
    'Each idea should be specific, realistic, and different from the others.',
    'Avoid vague buzzwords, generic clones, and overcomplicated business models.',
    'Prefer ideas that a small team could validate with an MVP.',
    'Return valid JSON only.',
    'Do not include markdown, code fences, or any explanation outside the JSON object.',
    '',
    'Use this exact JSON shape:',
    '{',
    '  "category": "string",',
    '  "ideas": [{ "title": "string", "explanation": "string" }]',
    '}',
    '',
    'Output requirements:',
    '- Include 3 to 5 ideas.',
    '- Each idea must have a short title.',
    '- Each explanation should be concise and clearly describe the customer problem and value.',
    '- Keep the ideas beginner-friendly and grounded in real market needs.',
    '',
    `Category: ${category}`,
  ].join('\n');
}

module.exports = {
  buildIdeaGenerationPrompt,
};
