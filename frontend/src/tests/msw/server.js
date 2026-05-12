import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// Node-side MSW server. We intentionally don't expose it to component
// code — only the global setup imports it. Per-test customisation goes
// through `server.use(...handlers)` inside the test body.
export const server = setupServer(...handlers);
