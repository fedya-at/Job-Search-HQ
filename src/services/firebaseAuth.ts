import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase App singleton safely
const app = !getApps().length && firebaseConfig.apiKey
  ? initializeApp(firebaseConfig)
  : (getApps().length ? getApp() : initializeApp(firebaseConfig));
export const auth = getAuth(app);

// Enable local persistence so user session stays logged in across browser reloads
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch (e) {
  // Ignored in non-browser environments
}

const provider = new GoogleAuthProvider();
// Google Workspace Scopes requested
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Cache access token in memory / session storage for seamless Google Sheets syncing
let cachedAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('jshq_google_token') : null;
let isSigningIn = false;

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const isPopupBlockedError = (error: any): boolean => {
  if (!error) return false;
  return (
    error.code === 'auth/popup-blocked' ||
    error.code === 'auth/cancelled-popup-request' ||
    error.code === 'auth/popup-closed-by-user' ||
    (typeof error.message === 'string' &&
      (error.message.includes('popup-blocked') ||
        error.message.includes('popup was blocked') ||
        error.message.includes('auth/popup-blocked') ||
        error.message.includes('popup-closed-by-user') ||
        error.message.includes('cancelled-popup-request')))
  );
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('jshq_google_token') : null) || '';
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('jshq_google_token');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (
  forceInIframe = false
): Promise<{ user: User; accessToken: string } | null> => {
  // If running in an embedded preview iframe and not forced, avoid triggering browser popup-blocked errors
  if (isInIframe() && !forceInIframe) {
    const err: any = new Error('auth/popup-blocked: running in preview iframe');
    err.code = 'auth/popup-blocked';
    throw err;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from credentials');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jshq_google_token', credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (isPopupBlockedError(error)) {
      console.warn('Google sign-in popup blocked or closed by user in current environment.');
    } else {
      console.error('Sign-in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Synchronous accessor to avoid losing user-gesture activation context
export const getAccessToken = (): string | null => {
  return cachedAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('jshq_google_token') : null);
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('jshq_google_token');
  }
};
