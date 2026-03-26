/**
 * Dashboard.jsx — Main workspace: schema panel | query center | results panel.
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LogOut, RefreshCw } from 'lucide-react'

import { getSchema, disconnectDatabase } from '../services/api'
import SchemaViewer from '../components/SchemaViewer'
import QueryBox from '../components/QueryBox'
import SQLPreview from '../components/SQLPreview'
import ResultTable from '../components/ResultTable'
import HistoryPanel from '../components/HistoryPanel'

export default function Dashboard({ connectionInfo, onDisconnect }) {
  // Generated SQL from AI
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [sqlExplanation, setSqlExplanation] = useState('')

  // Execution results
  const [queryResult, setQueryResult] = useState(null)
  const [resultError, setResultError] = useState(null)

  // Active right-panel tab
  const [rightTab, setRightTab] = useState('results') // 'results' | 'history'

  // Schema query
  const {
    data: schemaData,
    isLoading: schemaLoading,
    refetch: refetchSchema,
  } = useQuery({
    queryKey: ['schema'],
    queryFn: getSchema,
  })

  const handleDisconnect = async () => {
    try {
      await disconnectDatabase()
    } finally {
      onDisconnect()
    }
  }

  const handleSQLGenerated = useCallback((sql, explanation) => {
    setGeneratedSQL(sql)
    setSqlExplanation(explanation)
    setQueryResult(null)
    setResultError(null)
  }, [])

  const handleExecuted = useCallback((result) => {
    setQueryResult(result)
    setResultError(null)
    setRightTab('results')
  }, [])

  const handleExecuteError = useCallback((msg) => {
    setResultError(msg)
    setQueryResult(null)
    setRightTab('results')
  }, [])

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="flex-none flex items-center justify-between px-4 py-2
                         bg-terminal-surface border-b border-terminal-border">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-base gradient-text">
            AI DB Manager
          </span>
          <span className="text-terminal-border">│</span>
          <span className="font-mono text-xs text-terminal-muted truncate max-w-xs">
            {connectionInfo?.display_string || 'Connected'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-terminal-green/10 border border-terminal-green/30
                           text-terminal-green font-mono text-xs">
            ● live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchSchema()}
            className="p-2 rounded-md hover:bg-terminal-border/30 text-terminal-muted
                       hover:text-terminal-text transition-colors hover:cursor-pointer"
            title="Refresh schema"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md
                       bg-terminal-red/10 hover:bg-terminal-red/20
                       border border-terminal-red/30 text-terminal-red
                       font-mono text-xs transition-all duration-150 hover:cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </header>

      {/* ── 3-Panel Layout ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Schema viewer */}
        <aside className="w-64 flex-none border-r border-terminal-border overflow-y-auto">
          <SchemaViewer
            tables={schemaData?.tables || []}
            loading={schemaLoading}
          />
        </aside>

        {/* CENTER: Query + SQL preview */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-terminal-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <QueryBox onSQLGenerated={handleSQLGenerated} />

            {generatedSQL && (
              <SQLPreview
                sql={generatedSQL}
                explanation={sqlExplanation}
                onSQLChange={setGeneratedSQL}
                onExecuted={handleExecuted}
                onError={handleExecuteError}
              />
            )}
          </div>
        </main>

        {/* RIGHT: Results + History */}
        <aside className="w-[480px] flex-none flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex-none flex border-b border-terminal-border">
            {[
              { id: 'results', label: 'Results' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex-1 py-2.5 font-mono text-xs font-medium transition-all
                  ${rightTab === tab.id
                    ? 'text-terminal-blue border-b-2 border-terminal-blue bg-terminal-blue/5'
                    : 'text-terminal-muted hover:text-terminal-text hover:cursor-pointer'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'results' ? (
              <ResultTable result={queryResult} error={resultError} />
            ) : (
              <HistoryPanel
                onReplaySQL={(sql) => {
                  setGeneratedSQL(sql)
                  setRightTab('results')
                }}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
