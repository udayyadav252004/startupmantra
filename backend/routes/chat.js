const express = require('express');

const { getDb } = require('../config/firebase');
const {
  buildMockFallbackData,
  generateAIResponse,
  logAiError,
} = require('../config/openai');
const { buildIdeaSummary } = require('../prompts/roadmapPrompt');
const { buildMentorPrompt, normalizeChatHistory } = require('../prompts/chatPrompt');

const router = express.Router();
const IDEAS_COLLECTION = 'ideas';

async function getIdeaContextFromStore(ideaId) {
  if (!ideaId) {
    return null;
  }

  const db = getDb();
  const ideaDoc = await db.collection(IDEAS_COLLECTION).doc(ideaId).get();

  if (!ideaDoc.exists) {
    throw new Error('Idea not found for chat context.');
  }

  return ideaDoc.data();
}

router.post('/', async (req, res) => {
  const question = String(req.body.question || '').trim();
  const directIdeaSummary = buildIdeaSummary(req.body || {});
  const ideaId = String(req.body.ideaId || '').trim();

  if (!question) {
    return res.status(400).json({
      message: 'Question is required for chat.',
    });
  }

  if (!directIdeaSummary && !ideaId) {
    return res.status(400).json({
      message: 'Provide idea details or ideaId so the mentor can answer in context.',
    });
  }

  let ideaContextBody = req.body || {};

  if (!directIdeaSummary && ideaId) {
    try {
      const storedIdea = await getIdeaContextFromStore(ideaId);
      ideaContextBody = {
        ...storedIdea,
        question,
        history: req.body.history,
        roadmap: req.body.roadmap,
      };
    } catch (error) {
      console.error('[chat] Could not load idea context.', error.message);
      return res.status(500).json({
        message: error.message,
      });
    }
  }

  const resolvedIdeaSummary = buildIdeaSummary(ideaContextBody);

  if (!resolvedIdeaSummary) {
    return res.status(400).json({
      message: 'Provide idea details or ideaId so the mentor can answer in context.',
    });
  }

  const promptUsed = buildMentorPrompt({
    ...ideaContextBody,
    question,
    history: normalizeChatHistory(req.body.history),
    roadmap: req.body.roadmap,
  });

  const fallbackContext = {
    title: String(ideaContextBody.title || '').trim(),
    targetAudience: String(ideaContextBody.targetAudience || '').trim(),
    question,
  };

  try {
    const aiResult = await generateAIResponse([
      {
        role: 'user',
        content: promptUsed,
      },
    ], 'chat', {
      maxTokens: 700,
      temperature: 0.5,
      fallbackContext,
    });

    return res.json({
      message: 'Mentor response generated successfully.',
      model: aiResult.modelUsed,
      promptUsed,
      answer: aiResult.data,
    });
  } catch (error) {
    logAiError('chat', error);

    return res.json({
      message: 'Mentor response generated successfully.',
      model: 'fallback-system',
      promptUsed,
      answer: buildMockFallbackData('chat', fallbackContext),
    });
  }
});

module.exports = router;
