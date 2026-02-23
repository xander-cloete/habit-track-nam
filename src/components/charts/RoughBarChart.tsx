'use client';

import { useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from 'recharts';

export interface DayData {
  date: string;   // YYYY-MM-DD
  label: string;  // Mon, Tue, …
  completed: number;
  total: number;
  pct: number;    // 0-100
}

interface RoughBarChartProps {
  data: DayData[];
  today: string; // YYYY-MM-DD — highlighted bar
}

// Custom SVG bar that draws with rough.js
interface RoughBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  isToday?: boolean;
}

function RoughBarShape({ x = 0, y = 0, width = 0, height = 0, fill = '#C4713A' }: RoughBarShapeProps) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!ref.current || height <= 2 || width <= 2) {
      if (ref.current) ref.current.innerHTML = '';
      return;
    }

    const g = ref.current;
    g.innerHTML = '';

    const svg = g.ownerSVGElement;
    if (!svg) return;

    void import('roughjs').then(({ default: rough }) => {
      const rc = rough.svg(svg);
      const shape = rc.rectangle(x, y, width, height, {
        fill,
        fillStyle: 'hachure',
        stroke: fill,
        strokeWidth: 1.2,
        roughness: 1.8,
        hachureAngle: -41,
        hachureGap: 4,
        bowing: 1.2,
      });
      g.innerHTML = '';
      g.appendChild(shape);
    });
  }, [x, y, width, height, fill]);

  return <g ref={ref} />;
}

// Recharts v3 passes these props to content render functions
interface TooltipRenderProps {
  active?: boolean;
  payload?: Array<{ payload: DayData }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipRenderProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div
      className="paper-card px-3 py-2"
      style={{ fontSize: '0.85rem' }}
    >
      <p className="font-hand" style={{ color: 'var(--color-ink)' }}>{label}</p>
      <p className="font-body" style={{ color: 'var(--color-ink-faint)' }}>
        {d.completed} / {d.total} habits · {d.pct}%
      </p>
    </div>
  );
}

export default function RoughBarChart({ data, today }: RoughBarChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, bottom: 0, left: -28 }}
        barCategoryGap="24%"
      >
        <XAxis
          dataKey="label"
          tick={{ fontFamily: 'var(--font-hand, Caveat)', fontSize: 14, fill: 'var(--color-ink-faint)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontFamily: 'var(--font-hand, Caveat)', fontSize: 11, fill: 'var(--color-ink-faint)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          ticks={[0, 50, 100]}
        />
        {/* Cast to unknown to work around Recharts v3 generic variance */}
        <Tooltip
          content={(props) => <CustomTooltip {...(props as unknown as TooltipRenderProps)} />}
          cursor={false}
        />
        <Bar
          dataKey="pct"
          radius={[3, 3, 0, 0]}
          shape={(props: unknown) => {
            const p = props as RoughBarShapeProps & { date?: string };
            const isToday = p.date === today;
            return (
              <RoughBarShape
                {...p}
                fill={isToday ? '#C4713A' : '#D4C0A8'}
                isToday={isToday}
              />
            );
          }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.date}
              fill={entry.date === today ? '#C4713A' : '#D4C0A8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
