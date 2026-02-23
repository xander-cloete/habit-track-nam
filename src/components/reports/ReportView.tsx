'use client';

import type { Report } from '@/lib/db/schema';
import type { ReportMetrics } from '@/app/api/reports/generate/route';

interface ReportViewProps {
  report: Report;
  onBack: () => void;
}

// ── Inline mini-markdown renderer ──────────────────────────────────────────────
// Handles **bold headings** + • bullet lines, plain paragraphs.
function NarrativeBlock({ text }: { text: string }) {
  const blocks = text.split('\n\n').filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const firstLine = lines[0] ?? '';

        // Section header: **Title**
        if (firstLine.startsWith('**') && firstLine.endsWith('**')) {
          const title = firstLine.slice(2, -2);
          const bullets = lines.slice(1).filter((l) => l.startsWith('•'));
          return (
            <div key={i}>
              <p className="font-hand text-lg mb-1.5" style={{ color: 'var(--color-accent)' }}>
                {title}
              </p>
              <ul className="space-y-1">
                {bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>•</span>
                    <span className="font-body text-sm" style={{ color: 'var(--color-ink)' }}>
                      {b.replace(/^•\s*/, '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        // Plain paragraph
        return (
          <p key={i} className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

// ── Mini bar chart (pure CSS) ──────────────────────────────────────────────────
function MiniDayBars({ days }: { days: Array<{ label: string; pct: number; date: string }> }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex items-end gap-1" style={{ height: '64px' }}>
      {days.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t-sm"
            style={{
              height: `${Math.max(d.pct * 0.6, 2)}px`,
              backgroundColor: d.date === today ? 'var(--color-accent)' : 'var(--color-paper-ruled)',
              transition: 'height 0.3s ease',
            }}
          />
          <span
            className="font-hand text-xs"
            style={{
              color: d.date === today ? 'var(--color-accent)' : 'var(--color-ink-faint)',
              fontSize: '0.6rem',
            }}
          >
            {d.label[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  weekly:  '#4A90D9',
  monthly: '#9B72CF',
};

export default function ReportView({ report, onBack }: ReportViewProps) {
  const metrics    = report.metricsData as unknown as ReportMetrics | null;
  const insights   = (report.insightsData as unknown as string[] | null) ?? [];
  const accentColor = TYPE_COLOR[report.reportType] ?? '#4A90D9';
  const typeLabel   = report.reportType === 'weekly' ? 'Weekly Report' : 'Monthly Report';

  function formatDate(s: string | Date) {
    return new Date(typeof s === 'string' ? `${s}T00:00:00Z` : s).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="font-body text-sm mb-6 flex items-center gap-1"
        style={{ color: 'var(--color-ink-faint)' }}
      >
        ← Back to Reports
      </button>

      {/* Report header */}
      <div
        className="paper-card p-6 mb-6"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span
              className="font-body text-xs uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              {typeLabel}
            </span>
            <h1 className="font-hand text-2xl mt-1" style={{ color: 'var(--color-ink)' }}>
              {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
            </h1>
            {report.generatedAt && (
              <p className="font-body text-xs mt-1" style={{ color: 'var(--color-ink-faint)' }}>
                Generated {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          {metrics && (
            <div className="text-right">
              <p className="font-hand text-4xl" style={{ color: accentColor }}>
                {metrics.overallPct}%
              </p>
              <p className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>overall completion</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Habits',       value: String(metrics.totalHabits)      },
            { label: 'Completions',  value: String(metrics.totalCompletions) },
            { label: 'Best day',     value: metrics.bestDay  ? `${metrics.bestDay.label} ${metrics.bestDay.pct}%`   : '—' },
            { label: 'Worst day',    value: metrics.worstDay ? `${metrics.worstDay.label} ${metrics.worstDay.pct}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="paper-card p-3 text-center">
              <p className="font-hand text-xl" style={{ color: 'var(--color-ink)' }}>{value}</p>
              <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Daily trend bar chart */}
      {metrics && metrics.dailyRates.length > 0 && (
        <div className="paper-card p-4 mb-6">
          <p className="font-hand text-base mb-3" style={{ color: 'var(--color-ink)' }}>
            Daily Completion
          </p>
          <MiniDayBars days={metrics.dailyRates} />
        </div>
      )}

      {/* Top & weak habits */}
      {metrics && (metrics.topHabits.length > 0 || metrics.weakHabits.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Top habits */}
          {metrics.topHabits.length > 0 && (
            <div className="paper-card p-4">
              <p className="font-hand text-base mb-3" style={{ color: '#27AE60' }}>
                🏆 Top Habits
              </p>
              <div className="space-y-2">
                {metrics.topHabits.map((h, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-body text-xs" style={{ color: 'var(--color-ink)' }}>{h.title}</span>
                      <span className="font-hand text-xs" style={{ color: '#27AE60' }}>{h.pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: '4px' }}>
                      <div className="progress-fill" style={{ width: `${h.pct}%`, backgroundColor: '#27AE60' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Weak habits */}
          {metrics.weakHabits.length > 0 && (
            <div className="paper-card p-4">
              <p className="font-hand text-base mb-3" style={{ color: '#E67E22' }}>
                📌 Needs Attention
              </p>
              <div className="space-y-2">
                {metrics.weakHabits.map((h, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-body text-xs" style={{ color: 'var(--color-ink)' }}>{h.title}</span>
                      <span className="font-hand text-xs" style={{ color: '#E67E22' }}>{h.pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: '4px' }}>
                      <div className="progress-fill" style={{ width: `${h.pct}%`, backgroundColor: '#E67E22' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Narrative */}
      {report.narrativeText && (
        <div className="paper-card p-6 mb-6" style={{ borderLeft: `4px solid ${accentColor}` }}>
          <p
            className="font-hand text-xs uppercase tracking-widest mb-4"
            style={{ color: accentColor, letterSpacing: '0.12em' }}
          >
            ✦ Coach's Report
          </p>
          <NarrativeBlock text={report.narrativeText} />
        </div>
      )}

      {/* Insights chips */}
      {insights.length > 0 && (
        <div className="paper-card p-4 mb-6">
          <p className="font-hand text-base mb-3" style={{ color: 'var(--color-ink)' }}>
            Key Insights
          </p>
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, i) => (
              <span
                key={i}
                className="font-body text-xs px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-paper-dark)',
                  border: '1px solid var(--color-paper-ruled)',
                  color: 'var(--color-ink)',
                }}
              >
                {insight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active goals mentioned */}
      {metrics && metrics.activeGoalTitles.length > 0 && (
        <div className="paper-card p-4">
          <p className="font-hand text-base mb-2" style={{ color: 'var(--color-ink)' }}>
            Active Goals this Period
          </p>
          <div className="flex flex-wrap gap-2">
            {metrics.activeGoalTitles.map((title, i) => (
              <span
                key={i}
                className="font-body text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
              >
                {title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
