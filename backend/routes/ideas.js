const { randomUUID } = require('crypto');

const express = require('express');

const { getDb } = require('../config/firebase');
const { attachFirebaseUserIfPresent, requireFirebaseUser } = require('../middleware/firebaseAuth');

const router = express.Router();
const IDEAS_COLLECTION = 'ideas';

router.use(attachFirebaseUserIfPresent);
router.use(requireFirebaseUser);

function buildIdeaPayload(body, userId) {
  return {
    id: randomUUID(),
    title: String(body.title).trim(),
    description: String(body.description).trim(),
    targetAudience: String(body.targetAudience).trim(),
    budget: Number(body.budget),
    experienceLevel: String(body.experienceLevel).trim(),
    userId,
    createdAt: new Date().toISOString(),
  };
}

function sortNewestFirst(items) {
  return items.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(IDEAS_COLLECTION).where('userId', '==', req.firebaseUser.uid).get();
    const ideas = sortNewestFirst(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );

    return res.json({ ideas });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Could not load ideas.',
    });
  }
});

router.post('/', async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const targetAudience = String(req.body.targetAudience || '').trim();
  const experienceLevel = String(req.body.experienceLevel || '').trim();
  const budget = req.body.budget;

  if (!title || !description || !targetAudience || budget === '' || !experienceLevel) {
    return res.status(400).json({
      message: 'All idea fields are required.',
    });
  }

  const numericBudget = Number(budget);

  if (Number.isNaN(numericBudget) || numericBudget < 0) {
    return res.status(400).json({
      message: 'Budget must be a valid non-negative number.',
    });
  }

  try {
    const db = getDb();
    const idea = buildIdeaPayload(
      {
        title,
        description,
        targetAudience,
        budget: numericBudget,
        experienceLevel,
      },
      req.firebaseUser.uid
    );

    await db.collection(IDEAS_COLLECTION).doc(idea.id).set(idea);

    return res.status(201).json({
      message: 'Idea submitted successfully.',
      idea,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Could not save the idea.',
    });
  }
});

module.exports = router;
