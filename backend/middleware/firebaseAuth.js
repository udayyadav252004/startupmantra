const { getAdminAuth } = require('../config/firebase');

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice(7).trim();
}

function getRequestedUserId(req) {
  return String(req.body?.userId || req.query?.userId || '').trim();
}

function buildFirebaseUser(decodedToken) {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || '',
    emailVerified: decodedToken.email_verified === true,
    name: decodedToken.name || '',
  };
}

async function verifyFirebaseUserFromRequest(req) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return null;
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);

  if (!decodedToken.email_verified) {
    const error = new Error('Please verify your email before using StartupMantra.');
    error.status = 403;
    throw error;
  }

  const requestUserId = getRequestedUserId(req);

  if (requestUserId && requestUserId !== decodedToken.uid) {
    const error = new Error('Authenticated user does not match the requested userId.');
    error.status = 403;
    throw error;
  }

  return buildFirebaseUser(decodedToken);
}

async function authenticateFirebaseUser(req, res, next) {
  try {
    const firebaseUser = await verifyFirebaseUserFromRequest(req);

    if (!firebaseUser) {
      return res.status(401).json({
        message: 'Firebase access token is missing.',
      });
    }

    req.firebaseUser = firebaseUser;
    return next();
  } catch (error) {
    return res.status(error.status || 401).json({
      message: error.status ? error.message : 'Invalid or expired Firebase access token.',
    });
  }
}

async function attachFirebaseUserIfPresent(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    req.firebaseUser = await verifyFirebaseUserFromRequest(req);
  } catch (error) {
    console.warn('[auth] Optional Firebase auth skipped.', error.message);
  }

  return next();
}

function requireFirebaseUser(req, res, next) {
  if (!req.firebaseUser) {
    return res.status(401).json({
      message: 'Login required to save',
    });
  }

  return next();
}

module.exports = {
  attachFirebaseUserIfPresent,
  authenticateFirebaseUser,
  requireFirebaseUser,
};
