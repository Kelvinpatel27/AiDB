/**
 * QueryBox.jsx — Natural language query input with example suggestions.
 */

import { useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { generateSQL } from '../services/api'

const EXAMPLES = [
  'Show all users created this month',
  'Find the top 10 orders by amount',
  'Count users grouped by country',
  'Show products with price greater than 100',
  'List all orders placed in 2024',
]

export default function QueryBox({ onSQLGenerated }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await generateSQL(query.trim())
      onSQLGenerated(data.sql, data.explanation)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border">
        <Sparkles className="w-4 h-4 text-terminal-purple" />
        <span className="font-mono text-xs text-terminal-muted uppercase tracking-widest">
          Natural Language Query
        </span>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your data in plain English…&#10;e.g. Show all users registered last week"
          rows={4}
          className="w-full bg-terminal-bg border border-terminal-border rounded-lg
                     px-4 py-3 font-sans text-sm text-terminal-text
                     placeholder-terminal-muted/50 resize-none
                     focus:outline-none focus:border-terminal-purple
                     transition-all duration-200"
        />

        {/* Error */}
        {error && (
          <div className="mt-2 px-3 py-2 bg-terminal-red/10 border border-terminal-red/30
                          rounded-lg font-mono text-xs text-terminal-red animate-fade-in">
            ✗ {error}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-3 flex items-center justify-between">
          {/* Example pills */}
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.slice(0, 3).map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="px-2 py-1 rounded-md bg-terminal-bg border border-terminal-border
                           font-mono text-xs text-terminal-muted hover:text-terminal-blue
                           hover:border-terminal-blue/50 transition-all duration-150"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-terminal-purple/10 hover:bg-terminal-purple/20
                       border border-terminal-purple/40 hover:border-terminal-purple
                       text-terminal-purple font-mono text-sm font-medium
                       transition-all duration-200 flex-none
                       disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Generating…' : 'Generate SQL'}
          </button>
        </div>

        <p className="mt-2 text-right font-mono text-xs text-terminal-muted/50">
          ⌘ Enter to generate
        </p>
      </div>
    </div>
  )
}
