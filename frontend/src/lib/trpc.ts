import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';

export const trpc = createTRPCReact<any>();

export function getClientHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  return headers;
}

export function trpcClientOptions() {
  return {
    links: [
      httpBatchLink({
        url: typeof window !== 'undefined' ? '/trpc' : 'http://localhost:3001/trpc',
        headers: async () => getClientHeaders(),
      }),
    ],
  };
}
