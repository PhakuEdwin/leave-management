import express from 'express';
import cors from 'cors';
import path from 'path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './trpc';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// tRPC
app.use('/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Serve static frontend in production
const clientPath = path.join(__dirname, '..', 'client');
if (require('fs').existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Leave Management System running on http://localhost:${PORT}`);
});
