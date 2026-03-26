/**
 * SQLPreview.jsx — Shows the AI-generated SQL with edit + execute controls.
 */

import { useState } from 'react'
import { Code2, Play, Pencil, Check, X, Loader2, Info } from 'lucide-react'
import { executeSQL } from '../services/api'

export default function SQLPreview({
  sql,
  explanation,
  onSQLChange,
  onExecuted,
  onError,
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(sql)
  const [executing, setExecuting] = useState(false)

  // Sync edit buffer when a new SQL arrives
  if (!editing && editValue !== sql) {
    setEditValue(sql)
  }

  const handleExecute = async () => {
    const toRun = editing ? editValue : sql
    setExecuting(true)
    try {
      const result = await executeSQL(toRun)
      if (editing) {
        onSQLChange(editValue)
        setEditing(false)
      }
      onExecuted(result)
    } catch (err) {
      onError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  const handleSaveEdit = () => {
    onSQLChange(editValue)
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue(sql)
    setEditing(false)
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border">
        <Code2 className="w-4 h-4 text-terminal-green" />
        <span className="font-mono text-xs text-terminal-muted uppercase tracking-widest">
          Generated SQL
        </span>
        <span className="ml-auto flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => { setEditValue(sql); setEditing(true) }}
              className="flex items-center gap-1 px-2 py-1 rounded-md
                         hover:bg-terminal-border/30 text-terminal-muted
                         hover:text-terminal-text font-mono text-xs transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2 py-1 rounded-md
                           bg-terminal-green/10 text-terminal-green
                           hover:bg-terminal-green/20 font-mono text-xs transition-colors"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-2 py-1 rounded-md
                           hover:bg-terminal-border/30 text-terminal-muted
                           font-mono text-xs transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </>
          )}
        </span>
      </div>

      {/* SQL code area */}
      <div className="p-4 scanline">
        {editing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={Math.max(3, (editValue.match(/\n/g) || []).length + 2)}
            className="sql-textarea w-full bg-terminal-bg border border-terminal-blue/40
                       rounded-lg px-4 py-3 font-mono text-sm text-terminal-text
                       resize-none focus:outline-none focus:border-terminal-blue
                       glow-blue transition-all duration-200"
            spellCheck={false}
          />
        ) : (
          <pre className="font-mono text-sm text-terminal-green overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
            {sql}
          </pre>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-terminal-blue flex-none mt-0.5" />
          <p className="font-sans text-xs text-terminal-muted leading-relaxed">
            {explanation}
          </p>
        </div>
      )}

      {/* Execute bar */}
      <div className="px-4 py-3 border-t border-terminal-border flex items-center justify-end">
        <button
          onClick={handleExecute}
          disabled={executing}
          className="flex items-center gap-2 px-5 py-2 rounded-lg
                     bg-terminal-green/10 hover:bg-terminal-green/20
                     border border-terminal-green/40 hover:border-terminal-green
                     text-terminal-green font-mono text-sm font-medium
                     transition-all duration-200
                     disabled:opacity-40 hover:cursor-pointer"
        >
          {executing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {executing ? 'Executing…' : 'Execute'}
        </button>
      </div>
    </div>
  )
}
