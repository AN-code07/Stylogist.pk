import { create } from 'zustand';

// Persisted hint used to tell an anonymous first-visit apart from a genuine
// expired session. We drop a tiny marker in localStorage whenever we have a
// logged-in user, and clear it on explicit logout / 401. This lets the
// /users/me hook decide whether a 401 is "silent" (anon) or "session expired".
const SESSION_FLAG = 'stylogist.hadSession';

export const markHadSession = () => {
  try { localStorage.setItem(SESSION_FLAG, '1'); } catch { /* storage disabled */ }
};
export const hadSession = () => {
  try { return localStorage.getItem(SESSION_FLAG) === '1'; } catch { return false; }
};
export const clearHadSession = () => {
  try { localStorage.removeItem(SESSION_FLAG); } catch { /* ignore */ }
};

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthChecking: true, // Used to show a loading screen while checking the cookie on refresh

  // Called when login succeeds or when we fetch the user on page load
  setAuth: (user) => {
    markHadSession();
    set({ user, isAuthenticated: true, isAuthChecking: false });
  },

  // Called when logout succeeds or if the cookie is expired
  clearAuth: () => {
    clearHadSession();
    set({ user: null, isAuthenticated: false, isAuthChecking: false });
  },
}));

export default useAuthStore;