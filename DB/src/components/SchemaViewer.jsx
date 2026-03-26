/**
 * SchemaViewer.jsx — Left panel: collapsible database schema tree.
 */

import { useState } from 'react'
import { Database, Table2, ChevronRight, Key, Link, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function SchemaViewer({ tables, loading }) {
  const [openTables, setOpenTables] = useState(new Set())

  const toggle = (name) => {
    setOpenTables((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-terminal-border">
        <Database className="w-4 h-4 text-terminal-blue flex-none" />
        <span className="font-mono text-xs text-terminal-muted uppercase tracking-widest">
          Schema
        </span>
        {!loading && (
          <span className="ml-auto font-mono text-xs text-terminal-muted">
            {tables.length} tables
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-4 text-terminal-muted font-mono text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading schema…
          </div>
        ) : tables.length === 0 ? (
          <p className="px-4 py-4 text-terminal-muted font-mono text-xs">
            No tables found.
          </p>
        ) : (
          tables.map((table) => (
            <TableNode
              key={table.name}
              table={table}
              isOpen={openTables.has(table.name)}
              onToggle={() => toggle(table.name)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TableNode({ table, isOpen, onToggle }) {
  return (
    <div className="animate-fade-in">
      {/* Table row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5
                   hover:bg-terminal-surface transition-colors group"
      >
        <ChevronRight
          className={clsx(
            'w-3 h-3 text-terminal-muted transition-transform duration-150',
            isOpen && 'rotate-90',
          )}
        />
        <Table2 className="w-3.5 h-3.5 text-terminal-purple flex-none" />
        <span className="font-mono text-xs text-terminal-text group-hover:text-terminal-blue truncate">
          {table.name}
        </span>
        <span className="ml-auto font-mono text-xs text-terminal-muted opacity-0 group-hover:opacity-100">
          {table.columns.length}
        </span>
      </button>

      {/* Columns */}
      {isOpen && (
        <div className="ml-7 border-l border-terminal-border/50 pl-2 py-1">
          {table.columns.map((col) => (
            <ColumnRow key={col.name} col={col} />
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnRow({ col }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-terminal-surface">
      {col.primary_key ? (
        <Key className="w-3 h-3 text-terminal-orange flex-none" />
      ) : col.foreign_key ? (
        <Link className="w-3 h-3 text-terminal-cyan flex-none" />
      ) : (
        <span className="w-3 h-3 flex-none" />
      )}
      <span className="font-mono text-xs text-terminal-text/80 truncate">
        {col.name}
      </span>
      <span className="ml-auto font-mono text-xs text-terminal-muted/60 truncate max-w-[80px]">
        {col.type}
      </span>
    </div>
  )
}
