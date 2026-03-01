import { router } from './trpc';
import { exceptionsRouter } from './exceptions';

export const appRouter = router({
  exceptions: exceptionsRouter,
});

export type AppRouter = typeof appRouter;
