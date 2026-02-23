'use client';

import { useState, useEffect, useCallback } from 'react';
import ReportCard from './ReportCard';
import ReportView from './ReportView';
import type { Report } from '@/lib/db/schema';

type GeneratingType = 'weekly' | 'monthly' | null;

export default function ReportsPage() {
  const [reports, setReports]       = useState<Report[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState<GeneratingType>(null);
  const [selected, setSelected]     = useState<Report | null>(null);
  const [genError, setGenError]     = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const res  = await fetch('/api/reports');
      const data = (await res.json()) as { reports: Report[] };
      setReports(data.reports ?? []);
    } catch {
      /* silently ignore — list just stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  async function handleGenerate(type: 'weekly' | 'monthly') {
    setGenerating(type);
    setGenError('');
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { report: Report };
      const fresh = data.report;
      setReports((prev) => {
        const filtered = prev.filter(
          (r) => !(r.reportType === fresh.reportType && r.periodStart === fresh.periodStart),
        );
        return [fresh, ...filtered];
      });
      setSelected(fresh);
    } catch {
      setGenError(`Failed to generate ${type} report. Please try again.`);
    } finally {
      setGenerating(null);
    }
  }

  // ── Full-page report view ───────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="p-5 lg:p-10">
        <ReportView report={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  // ── Reports list ────────────────────────────────────────────────────────────
  const weeklyReports  = reports.filter((r) => r.reportType === 'weekly');
  const monthlyReports = reports.filter((r) => r.reportType === 'monthly');

  return (
    <div className="p-5 lg:p-10 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-hand text-3xl" style={{ color: 'var(--color-ink)' }}>
          Reports
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--color-ink-faint)' }}>
          AI-generated summaries of your habit progress.
        </p>
      </div>

      {/* Generate buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Weekly */}
        <div
          className="paper-card p-5"
          style={{ borderLeft: '4px solid #4A90D9' }}
        >
          <p className="font-hand text-lg mb-1" style={{ color: 'var(--color-ink)' }}>
            📋 Weekly Report
          </p>
          <p className="font-body text-xs mb-4" style={{ color: 'var(--color-ink-faint)' }}>
            Last 7 days — habit completion, wins, and one recommendation.
          </p>
          <button
            onClick={() => void handleGenerate('weekly')}
            disabled={generating !== null}
            className="font-body text-sm px-4 py-2 rounded-lg w-full"
            style={{
              backgroundColor: generating === 'weekly' ? 'var(--color-paper-ruled)' : '#4A90D9',
              color: generating === 'weekly' ? 'var(--color-ink-faint)' : '#ffffff',
              cursor: generating !== null ? 'not-allowed' : 'pointer',
            }}
          >
            {generating === 'weekly' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: '12px', height: '12px',
                    border: '2px solid #ffffff40',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Generating…
              </span>
            ) : 'Generate This Week'}
          </button>
        </div>

        {/* Monthly */}
        <div
          className="paper-card p-5"
          style={{ borderLeft: '4px solid #9B72CF' }}
        >
          <p className="font-hand text-lg mb-1" style={{ color: 'var(--color-ink)' }}>
            📅 Monthly Report
          </p>
          <p className="font-body text-xs mb-4" style={{ color: 'var(--color-ink-faint)' }}>
            Last 30 days — trends, highlights, and a forward-looking plan.
          </p>
          <button
            onClick={() => void handleGenerate('monthly')}
            disabled={generating !== null}
            className="font-body text-sm px-4 py-2 rounded-lg w-full"
            style={{
              backgroundColor: generating === 'monthly' ? 'var(--color-paper-ruled)' : '#9B72CF',
              color: generating === 'monthly' ? 'var(--color-ink-faint)' : '#ffffff',
              cursor: generating !== null ? 'not-allowed' : 'pointer',
            }}
          >
            {generating === 'monthly' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: '12px', height: '12px',
                    border: '2px solid #ffffff40',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Generating…
              </span>
            ) : 'Generate This Month'}
          </button>
        </div>
      </div>

      {/* Error */}
      {genError && (
        <p className="font-body text-sm mb-4 text-center" style={{ color: '#C0392B' }}>
          {genError}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg"
              style={{ height: '88px', backgroundColor: 'var(--color-paper-ruled)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="paper-card p-10 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-hand text-xl mb-2" style={{ color: 'var(--color-ink-light)' }}>
            No reports yet
          </p>
          <p className="font-body text-sm" style={{ color: 'var(--color-ink-faint)' }}>
            Generate your first report above to see your habit trends and AI coaching insights.
          </p>
        </div>
      )}

      {/* Weekly reports list */}
      {!loading && weeklyReports.length > 0 && (
        <section className="mb-6">
          <h2 className="font-hand text-xl mb-3" style={{ color: 'var(--color-ink)' }}>
            Weekly
          </h2>
          <div className="space-y-3">
            {weeklyReports.map((r) => (
              <ReportCard key={r.id} report={r} onSelect={setSelected} />
            ))}
          </div>
        </section>
      )}

      {/* Monthly reports list */}
      {!loading && monthlyReports.length > 0 && (
        <section>
          <h2 className="font-hand text-xl mb-3" style={{ color: 'var(--color-ink)' }}>
            Monthly
          </h2>
          <div className="space-y-3">
            {monthlyReports.map((r) => (
              <ReportCard key={r.id} report={r} onSelect={setSelected} />
            ))}
          </div>
        </section>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
