const path = require('path');
const { readFileSync } = require('fs');
const { getApps, initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let firestoreDb;

function getCredentialOptions() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (serviceAccountPath) {
    const fullPath = path.resolve(__dirname, '..', serviceAccountPath);
    const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));

    return {
      credential: cert(serviceAccount),
    };
  }

  // If you deploy on Google Cloud, applicationDefault() can use built-in credentials.
  return {
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || undefined,
  };
}

function getDb() {
  if (firestoreDb) {
    return firestoreDb;
  }

  try {
    const app = getApps()[0] || initializeApp(getCredentialOptions());
    firestoreDb = getFirestore(app);
    return firestoreDb;
  } catch (error) {
    throw new Error(
      'Firebase Admin is not configured. Add FIREBASE_SERVICE_ACCOUNT_KEY_PATH or application default credentials.'
    );
  }
}

module.exports = { getDb };
