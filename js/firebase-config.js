/*
 * =====================================================
 *  Firebase Configuration — Cooking for Iris
 * =====================================================
 *
 *  SETUP STEPS:
 *
 *  1. Go to https://console.firebase.google.com
 *  2. Click "Create a project" (name it anything, e.g. "cooking-for-iris")
 *  3. Disable Google Analytics (not needed), then click "Create"
 *  4. In your project, click "Build" > "Realtime Database" in the left sidebar
 *  5. Click "Create Database"
 *  6. Choose any location, click "Next"
 *  7. Create the database with locked rules. Apply database.rules.json
 *     after enabling Google sign-in and replacing the chef UID.
 *  8. Now go to Project Settings (gear icon top-left) > "General" tab
 *  9. Scroll down to "Your apps" > click the "</>" (Web) icon
 * 10. Register the app (name it anything), do NOT check "Firebase Hosting"
 * 11. Copy the config values below from the code snippet Firebase shows you
 *
 * =====================================================
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDGvp8e0DGh7zOrrbNoGMXWKzGlzMbSXt0",
  authDomain: "cooking-for-iris.firebaseapp.com",
  databaseURL: "https://cooking-for-iris-default-rtdb.firebaseio.com",
  projectId: "cooking-for-iris",
  storageBucket: "cooking-for-iris.firebasestorage.app",
  messagingSenderId: "856580882052",
  appId: "1:856580882052:web:1e953d236d73bb337c4cd1"
};
