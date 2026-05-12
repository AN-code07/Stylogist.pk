import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.js"],
    // Tailwind classes are useless under jsdom and parsing them slows the
    // test runner down a lot. We strip CSS unconditionally for tests.
    css: false,
    // Env vars consumed by the source under test. `VITE_API_URL` is read
    // by axiosClient — pointing it at a stable host lets MSW intercept
    // by URL match instead of relative-path guessing.
    env: {
      VITE_API_URL: "http://localhost:5000/api/v1",
      VITE_GA_MEASUREMENT_ID: "",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/main.jsx",
        "src/**/*.test.{js,jsx}",
        "src/tests/**",
        // Admin dashboard is mostly UI glue; skip in default coverage
        // so the focus stays on user-facing surfaces.
        "src/AdminDashboard/**",
      ],
    },
  },
});
