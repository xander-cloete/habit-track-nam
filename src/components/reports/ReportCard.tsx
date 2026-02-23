'use client';

import type { Report } from '@/lib/db/schema';
import type { ReportMetrics } from '@/app/api/reports/generate/route';

interface ReportCardProps {
  report: Report;
  onSelect: (report: Report) => void;
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  weekly:  { label: 'Weekly',  color: '#4A90D9', bg: '#D0DCE8' },
  monthly: { label: 'Monthly', color: '#9B72CF', bg: '#E8DDEE' },
};

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  const endFull = new Date(`${end}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return `${fmt(start)} – ${endFull}`;
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  completed:  { label: 'Ready',      color: '#1E8449', bg: '#D5F5E3' },
  generating: { label: 'Generating', color: '#B7950B', bg: '#FEF9E7' },
  pending:    { label: 'Pending',    color: '#8B8B7A', bg: '#F0EDE8' },
  failed:     { label: 'Failed',     color: '#C0392B', bg: '#FDECEA' },
};

export default function ReportCard({ report, onSelect }: ReportCardProps) {
  const typeStyle   = TYPE_STYLES[report.reportType] ?? TYPE_STYLES.weekly!;
  const statusStyle = STATUS_BADGES[report.status]   ?? STATUS_BADGES.pending!;
  const metrics     = report.metricsData as unknown as ReportMetrics | null;

  return (
    <button
      onClick={() => onSelect(report)}
      className="paper-card w-full text-left p-4 group transition-all"
      style={{
        borderLeft: `4px solid ${typeStyle.color}`,
        cursor: report.status === 'completed' ? 'pointer' : 'default',
      }}
      disabled={report.status !== 'completed'}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: type + dates */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-body text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
          >
            {typeStyle.label}
          </span>
          <span className="font-hand text-base" style={{ color: 'var(--color-ink)' }}>
            {formatDateRange(
              typeof report.periodStart === 'string' ? report.periodStart : String(report.periodStart),
              typeof report.periodEnd   === 'string' ? report.periodEnd   : String(report.periodEnd),
            )}
          </span>
        </div>

        {/* Right: status + pct */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {metrics && (
            <span
              className="font-hand text-lg"
              style={{ color: typeStyle.color }}
            >
              {metrics.overallPct}%
            </span>
          )}
          <span
            className="font-body text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Quick stat row */}
      {metrics && (
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            {metrics.totalHabits} habit{metrics.totalHabits !== 1 ? 's' : ''}
          </span>
          <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            {metrics.totalCompletions} completions
          </span>
          {metrics.bestDay && (
            <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
              Best: {metrics.bestDay.label} ({metrics.bestDay.pct}%)
            </span>
          )}
        </div>
      )}

      {/* Completion bar */}
      {metrics && (
        <div className="mt-3">
          <div className="progress-track" style={{ height: '4px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${metrics.overallPct}%`,
                backgroundColor: typeStyle.color,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Arrow hint when completed */}
      {report.status === 'completed' && (
        <p
          className="font-body text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: typeStyle.color }}
        >
          Click to read full report →
        </p>
      )}
    </button>
  );
}
