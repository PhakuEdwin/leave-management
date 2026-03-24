import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../server/router';

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:3003';
}

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
        transformer: superjson,
        headers() {
          const token = localStorage.getItem('leave-token');
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
