const express = require('express');

const {
  buildMockFallbackData,
  generateAIResponse,
  logAiError,
} = require('../config/openai');
const { buildIdeaGenerationPrompt } = require('../prompts/ideaGeneratorPrompt');

const router = express.Router();

router.post('/', async (req, res) => {
  const category = String(req.body.category || '').trim();

  if (!category) {
    return res.status(400).json({
      message: 'Category is required before generating startup ideas.',
    });
  }

  const promptUsed = buildIdeaGenerationPrompt(category);

  try {
    const aiResult = await generateAIResponse([
      {
        role: 'user',
        content: promptUsed,
      },
    ], 'ideas', {
      maxTokens: 900,
      temperature: 0.7,
      fallbackContext: { category },
    });

    return res.json({
      message: 'Startup ideas generated successfully.',
      model: aiResult.modelUsed,
      promptUsed,
      result: aiResult.data,
    });
  } catch (error) {
    logAiError('generate-ideas', error);

    return res.json({
      message: 'Startup ideas generated successfully.',
      model: 'fallback-system',
      promptUsed,
      result: buildMockFallbackData('ideas', { category }),
    });
  }
});

module.exports = router;
