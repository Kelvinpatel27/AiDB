/**
 * ConnectDatabase.jsx — Landing page for entering a DB connection string.
 * Aesthetic: terminal / developer tool — dark, monospaced, minimal chrome.
 */

import { useState } from 'react'
import { Database, Zap, Shield, Eye, EyeOff } from 'lucide-react'
import { connectDatabase } from '../services/api'

const EXAMPLE_STRINGS = [
  'postgresql://user:password@localhost:5432/mydb',
  'mysql+pymysql://user:password@localhost:3306/mydb',
  'sqlite:///./local.db',
]

export default function ConnectDatabase({ onConnected }) {
  const [connectionString, setConnectionString] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    if (!connectionString.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await connectDatabase(connectionString.trim())
      onConnected(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleConnect()
  }

  // Mask password in display
  const displayValue = showPassword
    ? connectionString
    : connectionString.replace(/:([^@:/]+)@/, ':••••••••@')

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#58a6ff 1px, transparent 1px), linear-gradient(90deg, #58a6ff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-terminal-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-terminal-surface border border-terminal-border mb-3 sm:mb-4 glow-blue">
            <Database className="w-6 sm:w-7 h-6 sm:h-7 text-terminal-blue" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold gradient-text mb-2">
            AI DB Manager
          </h1>
          <p className="text-terminal-muted font-mono text-xs sm:text-sm">
            Connect your database. Ask in plain English.
          </p>
        </div>

        {/* Card */}
        <div className="bg-terminal-surface border border-terminal-border rounded-2xl p-4 sm:p-6 scanline">
          {/* Window chrome dots */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-3 h-3 rounded-full bg-terminal-red/70" />
            <div className="w-3 h-3 rounded-full bg-terminal-orange/70" />
            <div className="w-3 h-3 rounded-full bg-terminal-green/70" />
            <span className="ml-2 text-terminal-muted font-mono text-xs">
              new connection
            </span>
          </div>

          <label className="block text-xs font-mono text-terminal-muted uppercase tracking-widest mb-2">
            Connection String
          </label>

          {/* Input with show/hide toggle */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="postgresql://user:pass@host:5432/db"
              className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-4 py-3 pr-12
                         font-mono text-sm text-terminal-text placeholder-terminal-muted/50
                         focus:outline-none focus:border-terminal-blue focus:glow-blue
                         transition-all duration-200"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted hover:text-terminal-text transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 px-3 py-2 bg-terminal-red/10 border border-terminal-red/30 rounded-lg
                            font-mono text-xs text-terminal-red animate-fade-in">
              ✗ {error}
            </div>
          )}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={loading || !connectionString.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3
                       bg-terminal-blue/10 hover:bg-terminal-blue/20
                       border border-terminal-blue/40 hover:border-terminal-blue
                       text-terminal-blue font-mono text-sm font-medium
                       rounded-lg transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-terminal-blue/30 border-t-terminal-blue rounded-full animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Connect  <span className="text-terminal-muted text-xs ml-1">⌘ Enter</span>
              </>
            )}
          </button>

          {/* Examples */}
          <div className="mt-5 pt-5 border-t border-terminal-border">
            <p className="text-xs font-mono text-terminal-muted mb-3">
              — Example formats
            </p>
            <div className="space-y-2">
              {EXAMPLE_STRINGS.map((s) => (
                <button
                  key={s}
                  onClick={() => setConnectionString(s)}
                  className="w-full text-left px-3 py-2 rounded-md bg-terminal-bg
                             border border-terminal-border hover:border-terminal-blue/50
                             font-mono text-xs text-terminal-muted hover:text-terminal-blue
                             transition-all duration-150 truncate"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-terminal-muted font-mono text-xs text-center px-2">
          <Shield className="w-3 h-3 flex-none" />
          <span>Connection stored in memory only — never persisted to disk.</span>
        </div>
      </div>
    </div>
  )
}
