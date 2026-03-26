/**
 * HistoryPanel.jsx — Shows past queries with status badges and replay option.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, RotateCcw, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { getHistory, clearHistory } from '../services/api'
import clsx from 'clsx'

export default function HistoryPanel({ onReplaySQL }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
    refetchInterval: 5000, // Auto-refresh every 5s
  })

  const clearMutation = useMutation({
    mutationFn: clearHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const entries = data?.entries || []

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-terminal-border">
        <Clock className="w-3.5 h-3.5 text-terminal-muted" />
        <span className="font-mono text-xs text-terminal-muted flex-1">
          {entries.length} queries
        </span>
        {entries.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="flex items-center gap-1 px-2 py-1 rounded-md
                       hover:bg-terminal-red/10 text-terminal-muted
                       hover:text-terminal-red font-mono text-xs transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-4 text-terminal-muted font-mono text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading history…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Clock className="w-8 h-8 text-terminal-muted/20 mb-3" />
            <p className="font-mono text-xs text-terminal-muted">
              No queries yet
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} onReplay={onReplaySQL} />
          ))
        )}
      </div>
    </div>
  )
}

function HistoryEntry({ entry, onReplay }) {
  const success = entry.status === 'success'

  return (
    <div className="group border-b border-terminal-border/50 px-3 py-3
                    hover:bg-terminal-surface/50 transition-colors">
      {/* Top row: status + timestamp */}
      <div className="flex items-center gap-2 mb-1.5">
        {success ? (
          <CheckCircle2 className="w-3 h-3 text-terminal-green flex-none" />
        ) : (
          <XCircle className="w-3 h-3 text-terminal-red flex-none" />
        )}
        <span
          className={clsx(
            'font-mono text-xs font-medium',
            success ? 'text-terminal-green' : 'text-terminal-red',
          )}
        >
          {success ? 'success' : 'error'}
        </span>
        {success && entry.row_count != null && (
          <span className="font-mono text-xs text-terminal-muted">
            · {entry.row_count} rows
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-terminal-muted/50">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Natural language */}
      {entry.natural_language && entry.natural_language !== '(direct execution)' && (
        <p className="font-sans text-xs text-terminal-text mb-1 truncate" title={entry.natural_language}>
          {entry.natural_language}
        </p>
      )}

      {/* SQL */}
      <pre className="font-mono text-xs text-terminal-muted truncate overflow-hidden">
        {entry.sql}
      </pre>

      {/* Error message */}
      {!success && entry.error_message && (
        <p className="mt-1 font-mono text-xs text-terminal-red/70 truncate">
          {entry.error_message}
        </p>
      )}

      {/* Replay button */}
      <button
        onClick={() => onReplay(entry.sql)}
        className="mt-2 flex items-center gap-1 px-2 py-1 rounded-md
                   opacity-0 group-hover:opacity-100
                   hover:bg-terminal-blue/10 text-terminal-muted
                   hover:text-terminal-blue font-mono text-xs transition-all duration-150"
      >
        <RotateCcw className="w-3 h-3" />
        Replay
      </button>
    </div>
  )
}
