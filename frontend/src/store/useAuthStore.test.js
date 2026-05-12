import { describe, it, expect, beforeEach } from "vitest";
import useAuthStore, {
  markHadSession,
  hadSession,
  clearHadSession,
} from "./useAuthStore.js";

// Each test starts with a clean store + localStorage (setup.js wipes
// localStorage; we also reset the store explicitly so an earlier
// setAuth call doesn't leak via the Zustand module-level instance).
beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isAuthChecking: true });
});

describe("hadSession / markHadSession / clearHadSession", () => {
  it("returns false on a fresh tab", () => {
    expect(hadSession()).toBe(false);
  });

  it("returns true after markHadSession is called", () => {
    markHadSession();
    expect(hadSession()).toBe(true);
  });

  it("clearHadSession reverses the flag", () => {
    markHadSession();
    clearHadSession();
    expect(hadSession()).toBe(false);
  });
});

describe("useAuthStore.setAuth", () => {
  it("hydrates the user + sets isAuthenticated", () => {
    useAuthStore.getState().setAuth({ _id: "u1", name: "Ali", role: "User" });
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ _id: "u1", name: "Ali", role: "User" });
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAuthChecking).toBe(false);
  });

  it("also persists the hadSession flag so future tabs distinguish anon vs expired", () => {
    useAuthStore.getState().setAuth({ _id: "u1", role: "User" });
    expect(hadSession()).toBe(true);
  });
});

describe("useAuthStore.clearAuth", () => {
  it("wipes the user and clears the hadSession flag", () => {
    useAuthStore.getState().setAuth({ _id: "u1", role: "User" });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(hadSession()).toBe(false);
  });
});
