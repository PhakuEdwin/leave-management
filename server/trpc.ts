import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';
import { verifyToken, type UserPayload } from './auth';

export interface Context {
  user: UserPayload | null;
}

export const createContext = ({ req }: CreateExpressContextOptions): Context => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null };
  }
  const token = authHeader.slice(7);
  const user = verifyToken(token);
  return { user };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
