const { getAdminAuth } = require('../config/firebase');

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice(7).trim();
}

async function authenticateFirebaseUser(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: 'Firebase access token is missing.',
    });
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    if (!decodedToken.email_verified) {
      return res.status(403).json({
        message: 'Please verify your email before using StartupMantra.',
      });
    }

    const requestUserId = String(req.body?.userId || req.query?.userId || '').trim();

    if (requestUserId && requestUserId !== decodedToken.uid) {
      return res.status(403).json({
        message: 'Authenticated user does not match the requested userId.',
      });
    }

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified === true,
      name: decodedToken.name || '',
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired Firebase access token.',
    });
  }
}

module.exports = { authenticateFirebaseUser };
