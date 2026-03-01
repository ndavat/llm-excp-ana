import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc';
import { Context } from './trpc/trpc';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config();

const app = express();
app.use(cors());

// In production, serve frontend static files
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): Context => {
  // Simple mock authentication for demonstration
  // In production, you would verify a JWT or session
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer mock-token') {
    return {
      user: {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
      },
    };
  }
  return {};
};

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// In production, serve index.html for any non-trpc requests (for SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
