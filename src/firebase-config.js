// Firebase web app config (Firebase console → Project settings → Your apps → learn-it-vocab → Config).
// These values are not secret: every Firebase website ships them to the browser.
// Access is protected by firestore.rules.
// If apiKey is empty, the site runs in "local mode": it uses the built-in copy of the data
// and keeps progress in the browser only.
export const firebaseConfig = {
  apiKey: 'AIzaSyAaI76a3_DacfghbfnKjUOPTxBJ2P0zVYc',
  authDomain: 'learn-it-vocab.firebaseapp.com',
  projectId: 'learn-it-vocab',
  storageBucket: 'learn-it-vocab.firebasestorage.app',
  messagingSenderId: '782463429248',
  appId: '1:782463429248:web:9cef1eb417f26478641465',
};

// App Check (protects the AI quota). Paste the reCAPTCHA v3 *site* key here after registering the web app
// in Firebase console → App Check → Apps → learn-it-vocab → reCAPTCHA. Leave empty to turn App Check off.
export const recaptchaSiteKey = '';
