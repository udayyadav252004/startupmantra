const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

let firebaseApp;
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

function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    firebaseApp = getApps()[0] || initializeApp(getFirebaseOptions());
    return firebaseApp;
  } catch (error) {
    throw new Error(error.message || 'Firebase Admin is not configured correctly.');
  }
}

function getDb() {
  if (firestoreDb) {
    return firestoreDb;
  }

  firestoreDb = getFirestore(getFirebaseApp());
  return firestoreDb;
}

function getAdminAuth() {
  return getAuth(getFirebaseApp());
}

module.exports = { getAdminAuth, getDb, getFirebaseApp };
