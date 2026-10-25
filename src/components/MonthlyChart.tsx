import { money } from "@/lib/format";

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

// Paired monthly bars for income and deductible expenses, drawn to one scale.
export function MonthlyChart({ months }: { months: { income: number; expenses: number }[] }) {
  const W = 460, H = 170, padL = 40, padB = 20, padT = 8;
  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expenses)));
  const step = niceStep(max / 3);
  const top = Math.ceil(max / step) * step;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const bw = (W - padL - 8) / 12;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Monthly income and expenses" className="font-mono text-[10px]">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - 4} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={padL - 6} y={y(v) + 3} textAnchor="end" fill="var(--muted)">{v >= 1000 ? `${v / 1000}k` : v}</text>
        </g>
      ))}
      {months.map((m, i) => {
        const x = padL + i * bw + bw * 0.15, w = bw * 0.33;
        return (
          <g key={i}>
            {m.income > 0 && <rect x={x} y={y(m.income)} width={w} height={y(0) - y(m.income)} fill="var(--accent)" rx={1.5}><title>{`${money(m.income)} income`}</title></rect>}
            {m.expenses > 0 && <rect x={x + w + 1} y={y(m.expenses)} width={w} height={y(0) - y(m.expenses)} fill="var(--stone)" rx={1.5}><title>{`${money(m.expenses)} expenses`}</title></rect>}
            <text x={padL + i * bw + bw / 2} y={H - 5} textAnchor="middle" fill="var(--muted)">{"JFMAMJJASOND"[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
