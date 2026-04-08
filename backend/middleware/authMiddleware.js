const jwt = require('jsonwebtoken');

const { getDb } = require('../config/firebase');

function sanitizeUser(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    createdAt: data.createdAt,
  };
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token missing.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is missing in backend/.env.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    // Verify the JWT first. If this fails, the user is not authenticated.
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = sanitizeUser(userDoc);
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Could not load user.' });
  }
}

module.exports = { authenticateToken };
