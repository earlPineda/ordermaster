import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Keep the session across page loads (the redirect flow reloads the page).
void setPersistence(auth, browserLocalPersistence).catch(() => {
  /* non-fatal - Firebase's default persistence still applies */
});

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
// "consent" forces the Google consent screen on every sign-in so the Google
// Sheets / Drive scopes above are actually GRANTED. Google only remembers the
// first consent and otherwise silently returns a token that is missing scopes
// added later, which breaks creating/updating the spreadsheet.
provider.setCustomParameters({
  prompt: 'select_account consent'
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory (never localStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google did not return an access token for Sheets/Drive access.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = (error?.code as string) || '';

    // Popups are frequently blocked by browsers/extensions. Fall back to the
    // full-page redirect flow, which is always allowed - the page reloads and
    // handleGoogleRedirectResult() (called on app boot) finishes the sign-in.
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return null;
    }

    // The user dismissed the popup on purpose - not an error.
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return null;
    }

    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Completes a sign-in that was started with signInWithRedirect().
 * Call once on app boot; resolves to null when there was no redirect.
 */
export const handleGoogleRedirectResult = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) return null;
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google redirect sign-in error:', error);
    throw error;
  }
};

/**
 * Turns cryptic Firebase/Google error codes into an instruction the admin can act on.
 */
export const describeGoogleAuthError = (error: any): string => {
  const code = (error?.code as string) || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this site';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `This site (${origin}) is not an allowed domain in your Firebase project. Fix: Firebase console -> Authentication -> Settings -> Authorized domains -> add "${origin}" (plus any other host you use).`;
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled. Fix: Firebase console -> Authentication -> Sign-in method -> Google -> Enable.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow popups for this site and try again, or disable your popup blocker.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before finishing. Click the button again and complete the consent screen.';
    case 'auth/invalid-credential':
      return 'Google rejected the sign-in. This usually means the OAuth consent screen is missing the Google Sheets / Drive scopes, or the app is still in "Testing" and this account is not listed as a Test user.';
    case 'auth/internal-error':
      return 'Google returned an internal error. Check that the Google Sheets and Drive scopes are added to the OAuth consent screen and that your account is a Test user while the app is in Testing.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Google. Check your internet connection and retry.';
    case 'auth/too-many-requests':
      return 'Google rate-limited sign-in attempts from this device. Wait a minute or two and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return error?.message || 'Google sign-in failed. Please try again.';
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
