/**
 * ResultTable.jsx — Displays query results in a styled data table.
 */

import { TableProperties, AlertCircle, CheckCircle2, Info } from 'lucide-react'

export default function ResultTable({ result, error }) {
  // Empty state
  if (!result && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <TableProperties className="w-10 h-10 text-terminal-muted/30 mb-3" />
        <p className="font-mono text-xs text-terminal-muted">
          Execute a query to see results here
        </p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 animate-fade-in">
        <div className="flex items-start gap-3 p-4 bg-terminal-red/10 border border-terminal-red/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-terminal-red flex-none mt-0.5" />
          <div>
            <p className="font-mono text-xs text-terminal-red font-medium mb-1">
              Execution Error
            </p>
            <p className="font-mono text-xs text-terminal-red/80 break-words">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // DML result (no rows returned)
  if (result.columns.length === 0) {
    return (
      <div className="p-4 animate-fade-in">
        <div className="flex items-start gap-3 p-4 bg-terminal-green/10 border border-terminal-green/30 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-terminal-green flex-none mt-0.5" />
          <div>
            <p className="font-mono text-xs text-terminal-green font-medium mb-1">
              Query executed successfully
            </p>
            {result.affected_rows != null && (
              <p className="font-mono text-xs text-terminal-green/80">
                {result.affected_rows} row(s) affected
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Meta bar */}
      <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-terminal-border">
        <Info className="w-3 h-3 text-terminal-blue" />
        <span className="font-mono text-xs text-terminal-muted">
          {result.row_count} row{result.row_count !== 1 ? 's' : ''} ·{' '}
          {result.columns.length} col{result.columns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-terminal-surface border-b border-terminal-border">
              {/* Row number header */}
              <th className="px-3 py-2 font-mono text-xs text-terminal-muted/50 w-10 border-r border-terminal-border">
                #
              </th>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 font-mono text-xs text-terminal-blue font-medium
                             whitespace-nowrap border-r border-terminal-border last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-terminal-border/50
                           hover:bg-terminal-surface/50 transition-colors"
              >
                {/* Row number */}
                <td className="px-3 py-1.5 font-mono text-xs text-terminal-muted/40
                               border-r border-terminal-border">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 font-mono text-xs text-terminal-text
                               border-r border-terminal-border last:border-r-0
                               max-w-[200px] truncate"
                    title={cell === null ? 'NULL' : String(cell)}
                  >
                    {cell === null ? (
                      <span className="text-terminal-muted/40 italic">NULL</span>
                    ) : typeof cell === 'boolean' ? (
                      <span className={cell ? 'text-terminal-green' : 'text-terminal-red'}>
                        {String(cell)}
                      </span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
