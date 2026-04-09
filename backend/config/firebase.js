const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let firestoreDb;

function parseServiceAccount() {
  const rawValue = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  if (!rawValue) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing.');
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be valid JSON.');
  }
}

function getFirebaseOptions() {
  const serviceAccount = parseServiceAccount();
  const projectId = String(process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || '').trim();

  return {
    credential: cert(serviceAccount),
    projectId: projectId || undefined,
  };
}

function getDb() {
  if (firestoreDb) {
    return firestoreDb;
  }

  try {
    const app = getApps()[0] || initializeApp(getFirebaseOptions());
    firestoreDb = getFirestore(app);
    return firestoreDb;
  } catch (error) {
    throw new Error(error.message || 'Firebase Admin is not configured correctly.');
  }
}

module.exports = { getDb };
