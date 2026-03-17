import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { QueryLog } from "../types";
import "./App.css";

interface AggregateStats {
  count: number;
  totalTokens: number;
  totalEnergyKwh: number;
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatEnergy(kwh: number | null): string {
  if (kwh == null) return "—";
  const mwh = kwh * 1000;
  return mwh < 1 ? `${(mwh * 1000).toFixed(2)} µWh` : `${mwh.toFixed(3)} mWh`;
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function App() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(
      "deviceId",
      async ({ deviceId }: { deviceId?: string }) => {
        if (!deviceId) {
          setLoading(false);
          return;
        }

        const [aggResult, listResult] = await Promise.all([
          supabase.rpc("get_query_aggregate_stats", { p_device_id: deviceId }),
          supabase
            .from("query_logs")
            .select("*")
            .eq("device_id", deviceId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (aggResult.data?.[0]) {
          const row = aggResult.data[0] as {
            query_count: number;
            total_tokens: number;
            total_energy_kwh: number;
          };
          setStats({
            count: row.query_count,
            totalTokens: row.total_tokens,
            totalEnergyKwh: row.total_energy_kwh,
          });
        }

        setLogs((listResult.data as QueryLog[]) ?? []);
        setLoading(false);
      },
    );
  }, []);

  const totalCo2Mg = stats ? stats.totalEnergyKwh * 400 * 1000 : 0; // gCO2e → mg for small numbers

  return (
    <div className="popup">
      <header className="header">
        <span>🌱</span>
        <span className="header-title">AI Environmental Tracker</span>
      </header>

      {!loading && stats && (
        <>
          <div className="section-header">Lifetime Stats</div>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{stats.count.toLocaleString()}</span>
              <span className="stat-label">Queries</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatTokens(stats.totalTokens)}
              </span>
              <span className="stat-label">Tokens</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatEnergy(stats.totalEnergyKwh)}
              </span>
              <span className="stat-label">Energy used</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {totalCo2Mg < 1000
                  ? `${totalCo2Mg.toFixed(1)} mg`
                  : `${(totalCo2Mg / 1000).toFixed(2)} g`}{" "}
                CO₂e
              </span>
              <span className="stat-label">Carbon</span>
            </div>
          </div>
        </>
      )}

      {loading && <p className="empty-state">Loading…</p>}

      {!loading && logs.length === 0 && (
        <p className="empty-state">
          No queries logged yet.
          <br />
          Send a message on ChatGPT!
        </p>
      )}

      {!loading && logs.length > 0 && (
        <>
          <div className="list-header">Recent Queries</div>
          <ul className="query-list">
            {logs.map((log) => (
              <li key={log.id} className="query-card">
                <div className="query-preview">
                  {log.prompt_preview
                    ? `"${log.prompt_preview}${log.prompt_preview.length >= 80 ? "…" : ""}"`
                    : "(no preview)"}
                </div>
                <div className="query-meta">
                  <span>{log.model}</span>
                  <span className="query-meta-sep">·</span>
                  <span>{log.estimated_tokens.toLocaleString()} tokens</span>
                  <span className="query-meta-sep">·</span>
                  <span>{formatEnergy(log.energy_kwh)}</span>
                  <span className="query-meta-sep">·</span>
                  <span>{relativeTime(log.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
