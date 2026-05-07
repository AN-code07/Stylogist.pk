// Load env vars immediately. We pin the path to the backend root so the
// .env is picked up regardless of where `node`/`nodemon` was launched
// from (e.g. running `npm --prefix backend run dev` from the repo root
// would otherwise have process.cwd() pointing at the repo root and miss
// backend/.env entirely).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;
let server;

// Orchestrate startup
const startServer = async () => {
  await connectDB(); // Ensure DB is up before accepting traffic
  
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Graceful Shutdown logic
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed. Process terminating.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('UNHANDLED EXCEPTION/REJECTION. Shutting down...');
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  if (server) {
    server.close(() => console.log('Process terminated cleanly.'));
  }
});