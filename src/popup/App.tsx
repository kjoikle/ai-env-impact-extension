import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { QueryLog } from '../types'

export default function App() {
  const [logs, setLogs] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.local.get('deviceId', async ({ deviceId }: { deviceId?: string }) => {
      if (!deviceId) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('query_logs')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(50)

      setLogs((data as QueryLog[]) ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ width: 320, padding: 16 }}>
      <h2 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
        ChatGPT Queries: {logs.length}
      </h2>

      {loading && <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>}

      {!loading && logs.length === 0 && (
        <p style={{ color: '#888', fontSize: 13 }}>No queries logged yet. Send a message on ChatGPT!</p>
      )}

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {logs.map((log) => (
          <li
            key={log.id}
            style={{
              padding: '8px 10px',
              background: '#f5f5f5',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 500 }}>{new Date(log.created_at).toLocaleString()}</div>
            <div style={{ color: '#555', marginTop: 2 }}>
              ~{log.estimated_tokens} tokens · {log.model}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
