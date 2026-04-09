const express = require('express');

const { getDb } = require('../config/firebase');
const { authenticateFirebaseUser } = require('../middleware/firebaseAuth');

const router = express.Router();
const ROADMAPS_COLLECTION = 'roadmaps';

router.use(authenticateFirebaseUser);

function sortNewestFirst(items) {
  return items.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(ROADMAPS_COLLECTION).where('userId', '==', req.firebaseUser.uid).get();
    const roadmaps = sortNewestFirst(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );

    return res.json({ roadmaps });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Could not load roadmaps.',
    });
  }
});

module.exports = router;
