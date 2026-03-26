/**
 * App.jsx — Root component.
 * Manages which page is shown and global connection state.
 */

import { useState, useEffect } from 'react'
import { getConnectionStatus } from './services/api'
import ConnectDatabase from './pages/ConnectDatabase'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [checking, setChecking] = useState(true)

  // On mount, check if a connection already exists (e.g. after hot-reload)
  useEffect(() => {
    getConnectionStatus()
      .then((data) => {
        if (data.connected) {
          setIsConnected(true)
          setConnectionInfo(data)
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div className="h-full flex items-center justify-center bg-terminal-bg">
        <div className="flex items-center gap-3 text-terminal-muted font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-terminal-blue animate-pulse-slow" />
          Initialising...
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <ConnectDatabase
        onConnected={(info) => {
          setConnectionInfo(info)
          setIsConnected(true)
        }}
      />
    )
  }

  return (
    <Dashboard
      connectionInfo={connectionInfo}
      onDisconnect={() => {
        setIsConnected(false)
        setConnectionInfo(null)
      }}
    />
  )
}