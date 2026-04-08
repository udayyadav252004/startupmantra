const { randomUUID } = require('crypto');

const express = require('express');

const { getDb } = require('../config/firebase');
const {
  buildMockFallbackData,
  generateAIResponse,
  logAiError,
} = require('../config/openai');
const { buildIdeaSummary, buildRoadmapPrompt } = require('../prompts/roadmapPrompt');

const router = express.Router();
const ROADMAPS_COLLECTION = 'roadmaps';
const ROADMAP_SAVE_TIMEOUT_MS = 5000;

function buildRoadmapRecord(body, ideaSummary, promptUsed, model, roadmap) {
  return {
    id: randomUUID(),
    ideaId: String(body.ideaId || '').trim(),
    ideaTitle: String(body.title || '').trim() || 'Untitled startup idea',
    ideaSummary,
    promptUsed,
    model,
    roadmap,
    createdAt: new Date().toISOString(),
  };
}

async function saveRoadmapRecord(record) {
  try {
    const db = getDb();

    await Promise.race([
      db.collection(ROADMAPS_COLLECTION).doc(record.id).set(record),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Roadmap save timed out after ${ROADMAP_SAVE_TIMEOUT_MS}ms.`));
        }, ROADMAP_SAVE_TIMEOUT_MS);
      }),
    ]);

    return '';
  } catch (error) {
    console.error('[roadmap] Could not save roadmap history.', error.message);
    return error.message || 'Could not save roadmap history.';
  }
}

router.post('/', async (req, res) => {
  const requestBody = req.body || {};
  const ideaSummary = buildIdeaSummary(requestBody);

  if (!ideaSummary) {
    return res.status(400).json({
      message: 'Provide either idea text or startup idea fields before generating a roadmap.',
    });
  }

  const promptUsed = buildRoadmapPrompt(ideaSummary);
  const fallbackContext = {
    title: String(requestBody.title || '').trim(),
    description: String(requestBody.description || '').trim(),
    targetAudience: String(requestBody.targetAudience || '').trim(),
    budget: requestBody.budget === undefined || requestBody.budget === null ? '' : String(requestBody.budget).trim(),
    experienceLevel: String(requestBody.experienceLevel || '').trim(),
  };

  try {
    const aiResult = await generateAIResponse([
      {
        role: 'user',
        content: promptUsed,
      },
    ], 'roadmap', {
      maxTokens: 1400,
      temperature: 0.2,
      fallbackContext,
    });

    const savedRoadmap = buildRoadmapRecord(
      requestBody,
      ideaSummary,
      promptUsed,
      aiResult.modelUsed,
      aiResult.data
    );

    const storageWarning = await saveRoadmapRecord(savedRoadmap);

    return res.json({
      message: 'Roadmap generated successfully.',
      model: aiResult.modelUsed,
      promptUsed,
      roadmap: aiResult.data,
      savedRoadmap,
      storageWarning,
    });
  } catch (error) {
    logAiError('roadmap', error);

    const fallbackRoadmap = buildMockFallbackData('roadmap', fallbackContext);
    const savedRoadmap = buildRoadmapRecord(
      requestBody,
      ideaSummary,
      promptUsed,
      'fallback-system',
      fallbackRoadmap
    );

    const storageWarning = await saveRoadmapRecord(savedRoadmap);

    return res.json({
      message: 'Roadmap generated successfully.',
      model: 'fallback-system',
      promptUsed,
      roadmap: fallbackRoadmap,
      savedRoadmap,
      storageWarning,
    });
  }
});

module.exports = router;
