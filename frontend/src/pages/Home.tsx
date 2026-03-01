import React from 'react'

export default function Home() {
  const isAuthed = !!localStorage.getItem('token')

  const signIn = () => {
    localStorage.setItem('token', 'mock-token')
    window.location.href = '/analyzer'
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80">
        <div className="container py-6 flex items-center justify-between">
          <div className="text-2xl font-bold"><span className="title-gradient">Exception Analyzer</span></div>
          <nav className="space-x-3">
            {isAuthed ? (
              <a href="/analyzer" className="btn btn-primary">Open Analyzer</a>
            ) : (
              <button className="btn btn-primary" onClick={signIn}>Sign In</button>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-16">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 title-gradient">Diagnose .NET Exceptions with AI</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">Trigger realistic exceptions, analyze root causes with an LLM, and email professional reports to your team.</p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Trigger Exceptions</h3>
            <p className="text-slate-300">Simulate common .NET exceptions with realistic messages, stack traces, and code snippets.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
            <p className="text-slate-300">Use LLMs to generate root cause analysis, actionable solutions, and best practices.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Email Reports</h3>
            <p className="text-slate-300">Notify owners with clean, readable reports and keep a log of all notifications.</p>
          </div>
        </section>
      </main>

      <footer className="container py-10 text-slate-500 text-sm">
        Built with React, tRPC, Drizzle ORM, and Tailwind CSS.
      </footer>
    </div>
  )
}
