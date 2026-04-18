const { randomUUID } = require('crypto');

const express = require('express');

const { getDb } = require('../config/firebase');
const { attachFirebaseUserIfPresent } = require('../middleware/firebaseAuth');
const {
  buildMockFallbackData,
  generateAIResponse,
  logAiError,
} = require('../config/openai');
const { buildIdeaSummary, buildRoadmapPrompt } = require('../prompts/roadmapPrompt');

const router = express.Router();
const ROADMAPS_COLLECTION = 'roadmaps';
const ROADMAP_SAVE_TIMEOUT_MS = 5000;

router.use(attachFirebaseUserIfPresent);

function buildRoadmapRecord(body, ideaSummary, promptUsed, model, roadmap, userId) {
  return {
    id: randomUUID(),
    ideaId: String(body.ideaId || '').trim(),
    ideaTitle: String(body.title || '').trim() || 'Untitled startup idea',
    ideaSummary,
    promptUsed,
    model,
    roadmap,
    userId,
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

async function buildRoadmapSaveResult(requestBody, ideaSummary, promptUsed, model, roadmap, firebaseUser) {
  if (!firebaseUser?.uid) {
    return {
      savedRoadmap: null,
      storageWarning: 'Login required to save',
    };
  }

  const savedRoadmap = buildRoadmapRecord(
    requestBody,
    ideaSummary,
    promptUsed,
    model,
    roadmap,
    firebaseUser.uid
  );

  const storageWarning = await saveRoadmapRecord(savedRoadmap);

  return {
    savedRoadmap,
    storageWarning,
  };
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

    const saveResult = await buildRoadmapSaveResult(
      requestBody,
      ideaSummary,
      promptUsed,
      aiResult.modelUsed,
      aiResult.data,
      req.firebaseUser
    );

    return res.json({
      message: 'Roadmap generated successfully.',
      model: aiResult.modelUsed,
      promptUsed,
      roadmap: aiResult.data,
      savedRoadmap: saveResult.savedRoadmap,
      storageWarning: saveResult.storageWarning,
    });
  } catch (error) {
    logAiError('roadmap', error);

    const fallbackRoadmap = buildMockFallbackData('roadmap', fallbackContext);
    const saveResult = await buildRoadmapSaveResult(
      requestBody,
      ideaSummary,
      promptUsed,
      'fallback-system',
      fallbackRoadmap,
      req.firebaseUser
    );

    return res.json({
      message: 'Roadmap generated successfully.',
      model: 'fallback-system',
      promptUsed,
      roadmap: fallbackRoadmap,
      savedRoadmap: saveResult.savedRoadmap,
      storageWarning: saveResult.storageWarning,
    });
  }
});

module.exports = router;
