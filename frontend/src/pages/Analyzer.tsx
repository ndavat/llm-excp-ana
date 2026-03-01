import React, { useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { formatDistanceToNow } from 'date-fns'

const exceptionButtons: Array<{key: any, label: string, color: string, desc: string}> = [
  { key: 'NullReferenceException', label: 'NullReference', color: 'bg-red-600 hover:bg-red-500', desc: 'Access null object' },
  { key: 'DivideByZeroException', label: 'DivideByZero', color: 'bg-orange-500 hover:bg-orange-400', desc: 'Divide by zero' },
  { key: 'ArgumentException', label: 'Argument', color: 'bg-yellow-500 hover:bg-yellow-400', desc: 'Invalid argument' },
  { key: 'IndexOutOfRangeException', label: 'IndexOutOfRange', color: 'bg-rose-500 hover:bg-rose-400', desc: 'Index bounds' },
  { key: 'InvalidOperationException', label: 'InvalidOperation', color: 'bg-purple-500 hover:bg-purple-400', desc: 'Invalid state' },
  { key: 'FileNotFoundException', label: 'FileNotFound', color: 'bg-cyan-600 hover:bg-cyan-500', desc: 'Missing file' },
]

export default function Analyzer() {
  const utils = trpc.useUtils?.() as any
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Queries
  const latestQuery = trpc.exceptions.latest.useQuery()
  const listQuery = trpc.exceptions.list.useQuery({ limit: 20, offset: 0 })

  // Mutations
  const triggerMutation = trpc.exceptions.trigger.useMutation({
    onSuccess: async (res) => {
      setSelectedId(res.exceptionId)
      setToast(res.message)
      await utils?.exceptions?.latest?.invalidate?.()
      await utils?.exceptions?.list?.invalidate?.()
    },
    onError: (err: any) => setToast(err.message)
  })

  const analyzeMutation = trpc.exceptions.analyzeLatest.useMutation({
    onSuccess: async (res) => {
      setToast(res.message)
      await utils?.exceptions?.latest?.invalidate?.()
      await utils?.exceptions?.list?.invalidate?.()
    },
    onError: (err: any) => setToast(err.message)
  })

  const selected = useMemo(() => {
    if (!selectedId) return latestQuery.data ?? null
    return listQuery.data?.find((e: any) => e.id === selectedId) ?? latestQuery.data ?? null
  }, [selectedId, latestQuery.data, listQuery.data])

  const analyze = () => analyzeMutation.mutate()
  const trigger = (type: any) => triggerMutation.mutate(type)

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80">
        <div className="container py-6 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold"><span className="title-gradient">Exception Analyzer</span></a>
          <div className="space-x-3">
            <a href="/analyzer" className="btn btn-outline">Analyzer</a>
          </div>
        </div>
      </header>

      <main className="container py-8 grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Trigger Exception</h2>
            <div className="grid-2x3">
              {exceptionButtons.map(btn => (
                <button key={btn.key} onClick={() => trigger(btn.key)} className={`btn ${btn.color}`}>
                  <div className="text-left">
                    <div className="font-semibold">{btn.label}</div>
                    <div className="text-xs opacity-80">{btn.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Exception Details</h2>
            {!selected ? (
              <div className="text-slate-400">No exception selected.</div>
            ) : (
              <div className="space-y-3">
                <div className="text-slate-300 text-sm">{selected.exceptionType} • {selected.createdAt ? formatDistanceToNow(new Date(selected.createdAt)) + ' ago' : ''}</div>
                <div><span className="text-slate-400">Message:</span> {selected.message}</div>
                <div>
                  <div className="text-slate-400">Stack Trace</div>
                  <pre className="bg-slate-900/70 border border-slate-800 rounded p-3 overflow-auto text-sm whitespace-pre-wrap">{selected.stackTrace}</pre>
                </div>
                <div>
                  <div className="text-slate-400">Simulated Code</div>
                  <pre className="bg-slate-900/70 border border-slate-800 rounded p-3 overflow-auto text-sm whitespace-pre-wrap">{selected.simulatedCode}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Analysis Results</h2>
            {!selected?.analysisResults?.length ? (
              <div className="text-slate-400">No analysis yet. Click Analyze Latest Exception.</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-slate-400">Root Cause</div>
                  <p>{selected.analysisResults[0].rootCause}</p>
                </div>
                <div>
                  <div className="text-slate-400">Solutions</div>
                  <ul className="list-disc ml-5 text-slate-200">
                    {(() => {
                      let sols: any = []
                      try { sols = JSON.parse(selected.analysisResults[0].solutions) } catch { sols = [] }
                      if (!Array.isArray(sols)) sols = [sols].filter(Boolean)
                      return sols.map((s: any, i: number) => <li key={i}>{String(s)}</li>)
                    })()}
                  </ul>
                </div>
                <div>
                  <div className="text-slate-400">Best Practices</div>
                  <p>{selected.analysisResults[0].recommendations}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <button onClick={analyze} className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400">Analyze Latest Exception</button>
          </div>

          <div className="card max-h-[480px] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">Recent Exceptions</h2>
            <div className="space-y-2">
              {listQuery.data?.map((e: any) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className={`w-full text-left p-2 rounded hover:bg-slate-700/60 ${selectedId===e.id?'bg-slate-700/50':''}`}>
                  <div className="text-sm">{e.exceptionType}</div>
                  <div className="text-xs text-slate-400">{e.createdAt ? formatDistanceToNow(new Date(e.createdAt)) + ' ago' : ''}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded px-4 py-2 shadow-lg">
          {toast}
          <button className="ml-3 text-slate-400 hover:text-slate-200" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}
    </div>
  )
}
