/**
 * api.js — Centralised Axios instance and API service functions.
 * All backend calls go through this module.
 */

import axios from 'axios'

// In production, always use same-origin /api and let Vercel rewrite to Railway.
// This avoids client DNS issues resolving Railway hostnames on some networks.
const baseURL = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_URL || '/api'

// Base URL — configurable in dev, same-origin in prod
const api = axios.create({
  baseURL,
  timeout: 60_000, // 60s for LLM calls
  headers: { 'Content-Type': 'application/json' },
})

// ─── Response interceptor: unwrap data or throw normalised error ──────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err?.response?.data?.detail ||
      err?.message ||
      'An unknown error occurred.'
    return Promise.reject(new Error(message))
  },
)

// ─── Connection ───────────────────────────────────────────────────────────────

export const connectDatabase = (connectionString) =>
  api.post('/connect', { connection_string: connectionString })

export const disconnectDatabase = () => api.post('/disconnect')

export const getConnectionStatus = () => api.get('/connection-status')

// ─── Schema ──────────────────────────────────────────────────────────────────

export const getSchema = () => api.get('/schema')

// ─── Query ───────────────────────────────────────────────────────────────────

/**
 * Convert natural language to SQL (does not execute).
 * @param {string} query
 * @returns {{ sql: string, explanation: string }}
 */
export const generateSQL = (query) => api.post('/generate-sql', { query })

/**
 * Execute a raw SQL string.
 * @param {string} sql
 * @returns {{ columns, rows, row_count, affected_rows }}
 */
export const executeSQL = (sql) => api.post('/execute', { sql })

// ─── History ─────────────────────────────────────────────────────────────────

export const getHistory = () => api.get('/history')

export const clearHistory = () => api.delete('/history')
