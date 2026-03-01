import React from 'react'
import { trpc, trpcClientOptions } from './lib/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './pages/Home'
import Analyzer from './pages/Analyzer'

const client = trpc.createClient(trpcClientOptions())

function Router() {
  const path = window.location.pathname
  if (path === '/analyzer') return <Analyzer />
  return <Home />
}

export default function App() {
  return (
    <trpc.Provider client={client} queryClient={new QueryClient()}>
      <Router />
    </trpc.Provider>
  )
}
