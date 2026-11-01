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

// App Check (protects the AI quota). The web app is registered in Firebase console → App Check → Apps
// with "Fraud Defense (reCAPTCHA Enterprise)"; this is that provider's site key (public, not a secret).
// Set recaptchaEnterprise to false if you switch the registration to classic reCAPTCHA v3. Empty key = App Check off.
export const recaptchaSiteKey = '6LfpWwsuAAAAAL8not00HVb9X88shB8202bsyoCb';
export const recaptchaEnterprise = true;
