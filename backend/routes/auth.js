const { randomUUID } = require('crypto');

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDb } = require('../config/firebase');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const USERS_COLLECTION = 'users';

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function findUserByEmail(db, email) {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

router.post('/signup', async (req, res) => {
  const { name = '', email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is missing in backend/.env.' });
  }

  try {
    const db = getDb();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await findUserByEmail(db, normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: randomUUID(),
      name: String(name).trim() || 'New User',
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    // Save the user record in Firestore. Never store the plain password.
    await db.collection(USERS_COLLECTION).doc(user.id).set(user);

    const token = createToken(user);

    return res.status(201).json({
      message: 'Signup successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Could not create user.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is missing in backend/.env.' });
  }

  try {
    const db = getDb();
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(db, normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the password sent by the user with the hashed password from Firestore.
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Could not log in.' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
