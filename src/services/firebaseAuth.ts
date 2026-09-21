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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
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

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && displayName.trim()) {
    try {
      await updateProfile(result.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not set displayName on new user:', e);
    }
  }
  return result.user;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred. Please try again.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please double check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/popup-blocked':
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was blocked or closed. Please allow popups or use email/password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'An error occurred during authentication. Please try again.';
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('jshq_google_token');
  }
};

