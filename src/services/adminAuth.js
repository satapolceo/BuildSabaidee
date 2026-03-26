import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export const ADMIN_REMEMBERED_EMAIL_STORAGE_KEY = 'buildsabaidee_admin_remembered_email';

export function getRememberedAdminEmail() {
  try {
    return String(window.localStorage.getItem(ADMIN_REMEMBERED_EMAIL_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function persistRememberedAdminEmail(email, shouldRemember) {
  try {
    if (shouldRemember && String(email || '').trim()) {
      window.localStorage.setItem(ADMIN_REMEMBERED_EMAIL_STORAGE_KEY, String(email || '').trim());
      return;
    }
    window.localStorage.removeItem(ADMIN_REMEMBERED_EMAIL_STORAGE_KEY);
  } catch {
    // ignore local storage failures
  }
}

export function validateAdminAuthInput({ email, password, isRegister = false }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail) return 'auth_email_required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return 'auth_invalid_email';
  if (!normalizedPassword) return 'auth_password_required';
  if (isRegister && normalizedPassword.length < 6) return 'auth_password_min_length';
  return '';
}

export function mapFirebaseAuthErrorToKey(error) {
  switch (String(error?.code || '')) {
    case 'auth/invalid-email':
      return 'auth_invalid_email';
    case 'auth/missing-password':
    case 'auth/internal-error':
      return 'auth_password_required';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'auth_invalid_credentials';
    case 'auth/email-already-in-use':
      return 'auth_email_in_use';
    case 'auth/weak-password':
      return 'auth_password_min_length';
    case 'auth/too-many-requests':
      return 'auth_too_many_requests';
    case 'auth/network-request-failed':
      return 'auth_network_error';
    default:
      return 'auth_generic_error';
  }
}

export async function signInWithEmail(auth, { email, password }) {
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, String(email || '').trim(), password);
}

export async function registerWithEmail(auth, { email, password }) {
  await setPersistence(auth, browserLocalPersistence);
  return createUserWithEmailAndPassword(auth, String(email || '').trim(), password);
}

export async function signInWithGoogle(auth) {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function getAuthTokenResult(user, forceRefresh = false) {
  if (!user?.getIdTokenResult) return null;
  return user.getIdTokenResult(forceRefresh);
}

export async function signInAdminWithEmail(auth, credentials) {
  return signInWithEmail(auth, credentials);
}

export async function registerAdminWithEmail(auth, credentials) {
  return registerWithEmail(auth, credentials);
}

export async function sendAdminPasswordReset(auth, email) {
  return sendPasswordResetEmail(auth, String(email || '').trim());
}

export async function signOutAdmin(auth) {
  return signOut(auth);
}

export function subscribeToAdminAuth(auth, callback) {
  return onAuthStateChanged(auth, callback);
}
