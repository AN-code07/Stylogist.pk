import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // setupFiles runs once per test file before the test code starts. Path
    // is relative to this config (i.e. backend/). The setup module spins
    // up an in-memory MongoDB instance and wires Mongoose into it.
    setupFiles: ["./src/tests/setup.js"],
    // Env vars below are injected BEFORE any user module is imported, so
    // env.js's fail-fast guards see real values during test runs and the
    // process doesn't exit on import. They're test-only secrets and never
    // hit a real database — see setup.js for the memory-server config.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "stylogist-test-jwt-secret",
      // Real mongo URI is replaced by MongoMemoryServer in setup.js; this
      // placeholder just satisfies the env.js fail-fast check at import.
      MONGO_URI: "mongodb://127.0.0.1:0/stylogist-test",
      SITE_URL: "http://localhost:5000",
    },
    // Memory-server's first download can take a while; subsequent runs are
    // fast. Generous test timeout keeps CI from flaking on cold installs.
    testTimeout: 30000,
    hookTimeout: 60000,
    // Run integration tests serially — they share one in-memory Mongo
    // instance, and parallel inserts to the same DB race against the
    // afterEach cleanup. Unit tests don't need this constraint, but the
    // simpler config wins until that becomes a measurable bottleneck.
    sequence: { concurrent: false },
    // Vitest 4 uses 'forks' as the default pool which works with mongoose,
    // but we pin a single fork so the memory-server connection isn't
    // duplicated across workers.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
