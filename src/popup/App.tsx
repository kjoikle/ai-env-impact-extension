import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { QueryLog } from "../types";
import "./App.css";

const LINK_TO_METRICS =
  "https://app.powerbi.com/view?r=eyJrIjoiZjVmOTI0MmMtY2U2Mi00ZTE2LTk2MGYtY2ZjNDMzODZkMjlmIiwidCI6IjQyNmQyYThkLTljY2QtNDI1NS04OTNkLTA2ODZhMzJjMTY4ZCIsImMiOjF9";

interface AggregateStats {
  count: number;
  totalTokens: number;
  totalEnergyWh: number;
  totalWaterMl: number;
  totalCarbonGrams: number;
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

function formatEnergy(wh: number | null): string {
  if (wh == null) return "—";
  return wh < 1 ? `${(wh * 1000).toFixed(2)} mWh` : `${wh.toFixed(2)} Wh`;
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatWater(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(2)} L` : `${ml.toFixed(1)} mL`;
}

function formatCarbon(g: number): string {
  return g < 1 ? `${(g * 1000).toFixed(2)} mg` : `${g.toFixed(2)} g`;
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
            total_energy_wh: number;
            total_water_ml: number;
            total_carbon_grams: number;
          };
          setStats({
            count: row.query_count,
            totalTokens: row.total_tokens,
            totalEnergyWh: row.total_energy_wh,
            totalWaterMl: row.total_water_ml,
            totalCarbonGrams: row.total_carbon_grams,
          });
        }

        setLogs((listResult.data as QueryLog[]) ?? []);
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="popup">
      <header className="header">
        <span>🌱</span>
        <span className="header-title">ChatGPT Environmental Tracker</span>
      </header>

      {/* Aggregate Stats */}
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
                {formatEnergy(stats.totalEnergyWh)}
              </span>
              <span className="stat-label">Energy</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatWater(stats.totalWaterMl)}
              </span>
              <span className="stat-label">Water</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatCarbon(stats.totalCarbonGrams)}
              </span>
              <span className="stat-label">Carbon</span>
            </div>
          </div>
        </>
      )}

      {/* Recent Queries */}

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
                  <span>{formatEnergy(log.energy_wh)}</span>
                  <span className="query-meta-sep">·</span>
                  <span>{relativeTime(log.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <a href={LINK_TO_METRICS} target="_blank" rel="noopener noreferrer">
          Usage Metrics Estimates Source
        </a>
      </footer>
    </div>
  );
}
