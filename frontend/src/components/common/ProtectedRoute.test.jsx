import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProtectedRoute from "./ProtectedRoute.jsx";
import useAuthStore from "../../store/useAuthStore.js";

// useMe hits /users/me which returns 401 via the default MSW handler.
// That's the "anonymous visitor" path. For authed cases we pre-seed the
// zustand store so the route never depends on the network response.

const renderRoute = (ui, { initialEntries = ["/protected"] } = {}) => {
  // Fresh QueryClient per test so a stale cached /users/me from a prior
  // test doesn't bleed in.
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/protected" element={ui} />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route path="/" element={<div>HOME PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isAuthChecking: false });
});

describe("<ProtectedRoute />", () => {
  it("renders the protected child when the user is authenticated", () => {
    useAuthStore.setState({
      user: { _id: "u1", name: "Ali", role: "User" },
      isAuthenticated: true,
      isAuthChecking: false,
    });
    renderRoute(
      <ProtectedRoute>
        <div>PROTECTED CONTENT</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("PROTECTED CONTENT")).toBeInTheDocument();
  });

  it("redirects to /login when no user is present and there was no prior session", () => {
    renderRoute(
      <ProtectedRoute>
        <div>PROTECTED CONTENT</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });

  it("redirects to home for non-admin users when adminOnly=true", () => {
    useAuthStore.setState({
      user: { _id: "u1", role: "User" },
      isAuthenticated: true,
    });
    renderRoute(
      <ProtectedRoute adminOnly>
        <div>ADMIN CONTENT</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("HOME PAGE")).toBeInTheDocument();
  });

  it("allows Super Admin past the adminOnly guard", () => {
    useAuthStore.setState({
      user: { _id: "u1", role: "Super Admin" },
      isAuthenticated: true,
    });
    renderRoute(
      <ProtectedRoute adminOnly>
        <div>ADMIN CONTENT</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("ADMIN CONTENT")).toBeInTheDocument();
  });

  it("allows Staff past the adminOnly guard", () => {
    useAuthStore.setState({
      user: { _id: "u1", role: "Staff" },
      isAuthenticated: true,
    });
    renderRoute(
      <ProtectedRoute adminOnly>
        <div>ADMIN CONTENT</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("ADMIN CONTENT")).toBeInTheDocument();
  });
});
