import { useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useRpc } from "../../hooks/useRpc";
import { insightsColours, insightsLayout, pageTitle, pageSubtitle } from "../../providers/theme";


/*
   SETTINGS
   Colours, margins and the page height come from providers/theme.ts, shared with the dashboard and leaderboard
 */

const C = insightsColours;
const SIDE_MARGIN = insightsLayout.sideMargin;
const LAYOUT_OFFSET_PX = insightsLayout.offsetPx;

//Same soft card shadow as the rows and cards in providers/theme.ts
const SHADOW = "0 1px 3px rgba(56, 35, 34, 0.06), 0 6px 18px rgba(56, 35, 34, 0.04)";


/*
   TYPES
   Shapes of the rows returned by the kpi_forecast_ SQL functions
 */

//One of the vendor's promotions
type PromoOption = {
  promo_id: number;
  promo_name: string;
  promo_type: "weekly" | "ongoing";
  discount_pct: number;
  promo_weekday: number | null;
  start_date: string;
  end_date: string;
  status: "running" | "planned" | "ended";
};

//Figures and forecast for one promotion (only the fields this page uses)
type Summary = {
  status: "running" | "planned" | "ended";
  next_date: string | null;
  last_week_date: string | null;
  last_week_orders: number | null;
  last_week_avg_value: number | null;
  days_so_far: number | null;
  orders_so_far: number | null;
  orders_per_day: number | null;
  avg_value: number | null;
  ly_start: string | null;
  ly_end: string | null;
  ly_days: number | null;
  ly_orders_per_day: number | null;
  ly_avg_value: number | null;
  predicted_days: number | null;
  predicted_end: string | null;
  planned_end: string | null;
  remaining_days: number | null;
  forecast_orders: number | null;
};

//Orders per hour: forecast, so far (ongoing) and before (last week or last year)
type HourRow = { hour_of_day: number; forecast_orders: number; recent_orders: number | null; compare_orders: number | null };

//One of the next 14 days with every active promotion together
type CombinedDay = {
  day: string;
  active_promos: string[];
  has_ongoing: boolean;
  has_weekly: boolean;
  period_type: string;
  forecast_orders: number | null;
  forecast_low: number | null;
  forecast_high: number | null;
  forecast_revenue: number | null;
};

//One of the last 28 complete days
type HistoryDay = { day: string; orders: number; has_ongoing: boolean; has_weekly: boolean; period_type: string };

//Last week's forecast against what happened
type Accuracy = { week_from: string; week_to: string; forecast_orders: number | null; actual_orders: number | null; accuracy_pct: number | null };

//Expected orders in one hour of one of the next 7 days
type BusyHour = { day: string; hour_of_day: number; forecast_orders: number };

//Average orders a day in lectures, exams or recess
type PeriodRow = {
  period_type: string;
  days: number;
  orders_per_day: number | null;
  change_vs_lectures_pct: number | null;
  is_current: boolean;
  next_name: string | null;
  next_start: string | null;
};



/*
   HELPERS
 */

const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const rand = (n: number | null | undefined) =>
  n == null ? "–" : new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(Number(n));

const count = (n: number | null | undefined) => (n == null ? "–" : new Intl.NumberFormat("en-ZA").format(Math.round(Number(n))));

//Dates written the same way everywhere on the page, for example "Mon 2 Nov" or "2 Nov 2025"
const dateParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .formatToParts(new Date(`${iso}T12:00:00Z`));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: get("weekday"), day: get("day"), month: get("month"), year: get("year") };
};
const shortDate = (iso: string | null | undefined) => {
  if (!iso) return "–";
  const p = dateParts(iso);
  return `${p.weekday} ${p.day} ${p.month}`;
};
const longDate = (iso: string | null | undefined) => {
  if (!iso) return "–";
  const p = dateParts(iso);
  return `${p.day} ${p.month} ${p.year}`;
};

//The 3 busiest hours from one column of the hours rows, for example ["13:00", "19:00", "20:00"]
const topHours = (rows: HourRow[] | null | undefined, key: "forecast_orders" | "recent_orders" | "compare_orders") =>
  (rows ?? [])
    .filter((r) => Number(r[key] ?? 0) > 0)
    .sort((a, b) => Number(b[key]) - Number(a[key]))
    .slice(0, 3)
    .map((r) => `${String(r.hour_of_day).padStart(2, "0")}:00`);

//Moves an ISO date by n days, for example addDays("2026-11-02", 7) = "2026-11-09"
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

//Number of days from a to b
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

//Hour written as a time, for example 13 = "13:00"
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

//The 2 hours in a row with the most expected orders on one day, for example [12, 13]
const peakWindow = (rows: BusyHour[]) => {
  const byHour = new Map(rows.map((r) => [r.hour_of_day, Number(r.forecast_orders)]));
  let best: [number, number] | null = null;
  let bestSum = -1;
  for (const r of rows) {
    const sum = Number(r.forecast_orders) + (byHour.get(r.hour_of_day + 1) ?? 0);
    if (sum > bestSum) { bestSum = sum; best = [r.hour_of_day, r.hour_of_day + 1]; }
  }
  return best;
};

//Period type in the plural as used in a sentence, for example "Exams" = "exams"
const periodWord = (t: string) => (t === "Other" ? "holidays" : t.toLowerCase());

//Width and height of a box on the screen, so the chart can fill whatever space is left
const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
};



/*
   BUILDING BLOCKS
   Same look as the dashboard: white rounded panels with a soft shadow,
   small capital labels and one size for the numbers
 */

//Thin outline used around the smaller boxes inside a panel
const OUTLINE = "1px solid rgba(56, 35, 34, 0.12)";

//Small capital label above a number (same as the column labels in the tables)
const Label = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "text.secondary", lineHeight: 1.4 }}>
    {children}
  </Typography>
);

//The one size used for the numbers on this page
const Value = ({ children, small }: { children: ReactNode; small?: boolean }) => (
  <Typography sx={{ fontSize: small ? 16 : 22, fontWeight: 800, color: C.brown, lineHeight: 1.2 }}>{children}</Typography>
);

//Small tag next to a title
const Tag = ({ label, dark }: { label: string; dark?: boolean }) => (
  <Chip size="small" label={label} sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: dark ? C.brown : C.cream, color: dark ? C.cream : C.brown }} />
);

//White rounded panel, like the dashboard's panels; grow = stretch to fill the height that is left,
//scroll = scroll inside the panel when its content is taller than the panel
const Panel = ({ icon, title, tags, subtitle, children, grow, scroll }: {
  icon: ReactNode; title: string; tags?: ReactNode; subtitle?: string; children: ReactNode; grow?: boolean; scroll?: boolean;
}) => (
  <Box sx={{ bgcolor: "#fff", borderRadius: 4, boxShadow: SHADOW, px: 2, py: 1.5, minWidth: 0, display: "flex", flexDirection: "column",
             ...(grow ? { flex: 1, minHeight: 140 } : { flexShrink: 0 }) }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.cream, color: C.brown }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: C.brown }}>{title}</Typography>
      {tags}
    </Box>
    {subtitle && <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.25, flexShrink: 0 }}>{subtitle}</Typography>}
    <Box sx={{ flex: grow ? 1 : "none", minHeight: 0, mt: 1, overflowY: scroll ? "auto" : "hidden", pr: scroll ? 0.5 : 0 }}>{children}</Box>
  </Box>
);

//Change against before, green when up, red when down
const Change = ({ now, before, unit }: { now: number | null | undefined; before: number | null | undefined; unit: string }) => {
  if (now == null || before == null) return null;
  const diff = Math.round(Number(now) - Number(before));
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: diff > 0 ? C.up : diff < 0 ? C.down : "text.secondary" }}>
      {diff === 0 ? "Same as before" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)} ${unit}`}
    </Typography>
  );
};

//Popular hours as small chips
const Hours = ({ hours }: { hours: string[] }) =>
  hours.length ? (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {hours.map((h) => <Chip key={h} size="small" label={h} sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: alpha(C.blue, 0.6) }} />)}
    </Box>
  ) : <Typography sx={{ fontSize: 12, color: "text.secondary" }}>–</Typography>;

//One promotion in the promotions panel: a thin outlined box with a title row
const PromoBox = ({ icon, title, tags, children }: { icon: ReactNode; title: string; tags?: ReactNode; children: ReactNode }) => (
  <Box sx={{ border: OUTLINE, borderRadius: 3, px: 1.5, py: 1, minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
      {icon}
      <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{title}</Typography>
      {tags}
    </Box>
    {children}
  </Box>
);



/*
   WEEKLY PROMOTION
   Last week next to the next promotion day
 */

const WeeklyPromo = ({ promo }: { promo: PromoOption }) => {
  const s = useRpc<Summary>("kpi_forecast_summary", { p_promo_id: promo.promo_id }).data?.[0];
  const hours = useRpc<HourRow>("kpi_forecast_hours", { p_promo_id: promo.promo_id }).data;
  const weekday = WEEKDAYS[promo.promo_weekday ?? 0];

  return (
    <PromoBox
      icon={<EventRepeatOutlinedIcon sx={{ fontSize: 18 }} />}
      title={promo.promo_name}
      tags={<>
        <Tag label={`Every ${weekday}`} />
        <Tag label={`${promo.discount_pct}% off`} />
        {promo.status === "planned" && <Tag label="Planned" dark />}
      </>}
    >
      {!s ? <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} /> : !s.next_date ? (
        <Typography sx={{ fontSize: 13 }}>This promotion has no more {weekday}s coming up.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
          <Box>
            <Label>Last {weekday.slice(0, 3)} · {shortDate(s.last_week_date).slice(4)}</Label>
            <Value small>{count(s.last_week_orders)}</Value>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Avg {rand(s.last_week_avg_value)}</Typography>
          </Box>
          <Box sx={{ bgcolor: C.yellow, borderRadius: 2, px: 1, py: 0.5 }}>
            <Label>Next · {shortDate(s.next_date)}</Label>
            <Value small>~{count(s.forecast_orders)}</Value>
            <Change now={s.forecast_orders} before={s.last_week_orders} unit="vs last week" />
          </Box>
          <Box>
            <Label>Popular hours</Label>
            <Hours hours={topHours(hours, "forecast_orders")} />
          </Box>
        </Box>
      )}
    </PromoBox>
  );
};



/*
   SUMMARY AND KEY FIGURES
 */

//One-line summary at the top of the page
const SummaryLine = ({ week, busiest, peak, nextPeriod }: {
  week: number; busiest: CombinedDay | null; peak: [number, number] | null; nextPeriod: string | null;
}) => (
  <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", bgcolor: C.blue, borderRadius: 4, px: 2, py: 0.75, flexShrink: 0 }}>
    <LightbulbOutlinedIcon fontSize="small" />
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
      Expect about <b>{count(week)} orders</b> over the next 7 days.
      {busiest && <> <b>{WEEKDAYS[Number(new Date(`${busiest.day}T12:00:00Z`).getUTCDay()) || 7]}</b> will be your busiest day</>}
      {busiest && peak && <>, peaking between <b>{hourLabel(peak[0])} and {hourLabel(peak[1] + 1)}</b></>}
      {busiest && "."}
      {nextPeriod && <> {nextPeriod}</>}
    </Typography>
  </Box>
);

//One key figure card in the row at the top
const Kpi = ({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) => (
  <Box sx={{ bgcolor: highlight ? C.yellow : "#fff", borderRadius: 4, boxShadow: SHADOW, px: 2, py: 1, minWidth: 0 }}>
    <Label>{label}</Label>
    <Value>{value}</Value>
    {sub && <Typography noWrap sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{sub}</Typography>}
  </Box>
);



/*
   ORDERS PER DAY CHART
   Last 4 weeks (solid line) and the next 2 weeks (dashed line with the likely range).
   The chart is drawn at the size of the space it is given, so it fills the panel.
 */

const PAD = { left: 36, right: 12, top: 14, bottom: 26 };

const OrdersChart = ({ history, forecast }: { history: HistoryDay[]; forecast: CombinedDay[] }) => {
  const { ref, width, height } = useSize<HTMLDivElement>();
  //The day the mouse is over, for the hover box
  const [hover, setHover] = useState<number | null>(null);
  const days = [
    ...history.map((h) => ({ day: h.day, actual: Number(h.orders), fc: null as number | null, lo: null as number | null, hi: null as number | null, weekly: h.has_weekly, period: h.period_type })),
    ...forecast.map((f) => ({ day: f.day, actual: null as number | null, fc: Number(f.forecast_orders ?? 0), lo: Number(f.forecast_low ?? 0), hi: Number(f.forecast_high ?? 0), weekly: f.has_weekly, period: f.period_type })),
  ];
  const W = Math.max(width, 200);
  const H = Math.max(height, 120);

  //Scale: rounded up to a tidy number so the grid lines are whole numbers
  const top = Math.max(...days.map((d) => Math.max(d.actual ?? 0, d.hi ?? 0, d.fc ?? 0)), 4);
  const step = Math.max(1, Math.ceil(top / 4 / 5) * 5);
  const maxY = step * 4;
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(1, days.length - 1);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / maxY);
  const todayIndex = history.length;
  const slot = (W - PAD.left - PAD.right) / Math.max(1, days.length - 1);

  //Solid line: actual orders up to yesterday. Dashed line: the forecast from today.
  //A faint dotted link joins yesterday's actual orders to today's forecast.
  const actualPath = days.slice(0, todayIndex).map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.actual ?? 0)}`).join("");
  const forecastPath = days.slice(todayIndex).map((d, i) => `${i ? "L" : "M"}${x(todayIndex + i)},${y(d.fc ?? 0)}`).join("");
  const linkPath = todayIndex > 0 && days.length > todayIndex
    ? `M${x(todayIndex - 1)},${y(days[todayIndex - 1].actual ?? 0)}L${x(todayIndex)},${y(days[todayIndex].fc ?? 0)}` : "";
  const band = days.slice(todayIndex);
  const bandPath = band.length
    ? band.map((d, i) => `${i ? "L" : "M"}${x(todayIndex + i)},${y(d.hi ?? 0)}`).join("")
      + [...band].reverse().map((d, i) => `L${x(todayIndex + band.length - 1 - i)},${y(d.lo ?? 0)}`).join("") + "Z"
    : "";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box ref={ref} sx={{ flex: 1, minHeight: 0, position: "relative" }} onMouseLeave={() => setHover(null)}>
        {width > 0 && height > 0 && days.length > 0 && (
          <svg width={W} height={H} style={{ display: "block" }}>
            {/* Exam days shaded yellow */}
            {days.map((d, i) => d.period === "Exams" && (
              <rect key={`e${d.day}`} x={x(i) - slot / 2} y={PAD.top} width={slot} height={H - PAD.top - PAD.bottom} fill={alpha(C.yellow, 0.7)} />
            ))}
            {/* Grid lines and numbers */}
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(k * step)} y2={y(k * step)} stroke="rgba(56, 35, 34, 0.08)" />
                <text x={PAD.left - 8} y={y(k * step) + 4} textAnchor="end" fontSize={11} fill="rgba(56, 35, 34, 0.6)">{k * step}</text>
              </g>
            ))}
            {/* Likely range, forecast and actual orders */}
            {bandPath && <path d={bandPath} fill={alpha(C.midBlue, 0.2)} />}
            <path d={actualPath} fill="none" stroke={C.brown} strokeWidth={2.5} strokeLinejoin="round" />
            {linkPath && <path d={linkPath} fill="none" stroke="rgba(56, 35, 34, 0.35)" strokeWidth={1.5} strokeDasharray="2 3" />}
            <path d={forecastPath} fill="none" stroke={C.midBlue} strokeWidth={2.5} strokeDasharray="6 5" strokeLinejoin="round" />
            {/* Yesterday: the last day with actual orders */}
            {todayIndex > 0 && <circle cx={x(todayIndex - 1)} cy={y(days[todayIndex - 1].actual ?? 0)} r={3.5} fill={C.brown} />}
            {/* Weekly promotion days */}
            {days.map((d, i) => d.weekly && (
              <circle key={`w${d.day}`} cx={x(i)} cy={y(d.actual ?? d.fc ?? 0)} r={4} fill={C.down} />
            ))}
            {/* Today */}
            <line x1={x(todayIndex)} x2={x(todayIndex)} y1={PAD.top} y2={H - PAD.bottom} stroke={C.down} strokeDasharray="3 3" />
            <text x={x(todayIndex) + 5} y={PAD.top + 11} fontSize={11} fontWeight={700} fill={C.down}>Today</text>
            {/* Mondays on the bottom axis */}
            {days.map((d, i) => dateParts(d.day).weekday === "Mon" && (
              <text key={`m${d.day}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="rgba(56, 35, 34, 0.6)">
                {dateParts(d.day).day} {dateParts(d.day).month}
              </text>
            ))}
            {/* Hover: a guide line and dot on the day under the mouse */}
            {hover != null && days[hover] && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(56, 35, 34, 0.35)" />
                <circle cx={x(hover)} cy={y(days[hover].actual ?? days[hover].fc ?? 0)} r={5}
                        fill={days[hover].actual != null ? C.brown : C.midBlue} stroke="#fff" strokeWidth={2} />
              </g>
            )}
            {/* Invisible strips, one per day, that pick up the mouse */}
            {days.map((d, i) => (
              <rect key={`h${d.day}`} x={x(i) - slot / 2} y={PAD.top} width={slot} height={H - PAD.top - PAD.bottom}
                    fill="transparent" onMouseEnter={() => setHover(i)} />
            ))}
          </svg>
        )}
        {/* Hover box with the day's figures */}
        {hover != null && days[hover] && (() => {
          const d = days[hover];
          const left = x(hover) > W * 0.65;
          return (
            <Box sx={{
              position: "absolute", top: PAD.top, pointerEvents: "none",
              ...(left ? { right: W - x(hover) + 10 } : { left: x(hover) + 10 }),
              bgcolor: "#fff", border: OUTLINE, borderRadius: 2, boxShadow: SHADOW, px: 1.25, py: 0.75, minWidth: 150,
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                {shortDate(d.day)}{hover === todayIndex ? " · today" : ""}
              </Typography>
              {d.actual != null ? (
                <Typography sx={{ fontSize: 13 }}><b>{d.actual}</b> orders (actual)</Typography>
              ) : (
                <>
                  <Typography sx={{ fontSize: 13 }}>About <b>{count(d.fc)}</b> orders (forecast)</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Likely {count(d.lo)} – {count(d.hi)}</Typography>
                </>
              )}
              {(d.period === "Exams" || d.weekly) && (
                <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}>
                  {[d.period === "Exams" ? "Exams" : null, d.weekly ? "Weekly promotion day" : null].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </Box>
          );
        })()}
      </Box>
      {/* Legend */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 0.75, flexShrink: 0 }}>
        {[
          { label: "Actual orders", colour: C.brown },
          { label: "Forecast", colour: C.midBlue },
          { label: "Likely range", colour: alpha(C.midBlue, 0.2) },
          { label: "Exams", colour: alpha(C.yellow, 0.9) },
          { label: "Weekly promotion day", colour: C.down, round: true },
        ].map((l) => (
          <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: l.round ? 9 : 12, height: 9, borderRadius: l.round ? "50%" : 0.75, bgcolor: l.colour }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>{l.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};



/*
   NEXT PERIOD MESSAGE
   Used in the summary line at the top of the page
 */

//The sentence about the next change of period, for example
//"Exams start on Thu 19 Nov. Your orders are usually about 6% higher in exams than in lectures, so plan for around 13 orders a day."
const nextPeriodMessage = (rows: PeriodRow[], today: string | undefined) => {
  if (!today) return null;
  const current = rows.find((p) => p.is_current) ?? rows.find((p) => p.period_type === "Lectures");
  const next = rows
    .filter((p) => !p.is_current && p.next_start && daysBetween(today, p.next_start) <= 30)
    .sort((a, b) => (a.next_start! < b.next_start! ? -1 : 1))[0];
  if (!next || !current || next.orders_per_day == null || !current.orders_per_day) return null;
  const change = Math.round(((Number(next.orders_per_day) - Number(current.orders_per_day)) / Number(current.orders_per_day)) * 100);
  const word = periodWord(next.period_type);
  const start = `${next.period_type} ${next.period_type === "Exams" ? "start" : "starts"} on ${shortDate(next.next_start)}.`;
  if (change === 0) return `${start} Your orders are usually about the same in ${word} as in ${periodWord(current.period_type)}.`;
  return `${start} Your orders are usually about ${Math.abs(change)}% ${change > 0 ? "higher" : "lower"} in ${word} than in ${periodWord(current.period_type)}, so plan for around ${Math.round(Number(next.orders_per_day))} orders a day.`;
};


/*
   ONGOING PROMOTION
   Two bars on one timeline: last year's similar promotion above this one (so far, then the forecast for the rest)
 */

const OngoingPromo = ({ promo, today }: { promo: PromoOption; today: string }) => {
  const s = useRpc<Summary>("kpi_forecast_summary", { p_promo_id: promo.promo_id }).data?.[0];
  const planned = promo.status === "planned";
  const end = s ? (s.planned_end ?? s.predicted_end) : null;
  const perDayAhead = s?.forecast_orders != null && s.remaining_days ? Number(s.forecast_orders) / s.remaining_days : null;

  //Last year's dates moved forward a year so the two bars line up
  const lyFrom = s?.ly_start ? addDays(s.ly_start, 365) : null;
  const lyTo = s?.ly_end ? addDays(s.ly_end, 365) : null;
  const thisTo = end ?? today;
  const from = [promo.start_date, lyFrom].filter(Boolean).sort()[0]!;
  const to = [thisTo, lyTo, today].filter(Boolean).sort().reverse()[0]!;
  const total = Math.max(1, daysBetween(from, to) + 1);
  const pos = (iso: string) => (daysBetween(from, iso) / total) * 100;
  const width = (a: string, b: string) => ((daysBetween(a, b) + 1) / total) * 100;

  //The one sentence that explains the end date
  const sentence = !s ? "" : !end
    ? "You haven't run a promotion like this before, so there is nothing to predict its end date from yet."
    : s.planned_end
      ? `You planned this promotion until ${shortDate(s.planned_end)}.`
      : s.ly_start
        ? `Last year a similar promotion ran for ${s.ly_days} days, so this one should end around ${shortDate(end)}.`
        : `You didn't run a similar promotion at this time last year, so the end date is based on how long your promotions usually run.`;

  //One bar segment on the timeline
  const Segment = ({ a, b, bg, colour, dashed, text }: { a: string; b: string; bg: string; colour?: string; dashed?: boolean; text: string }) => (
    <Box title={text} sx={{
      position: "absolute", top: 0, bottom: 0, left: `${pos(a)}%`, width: `${width(a, b)}%`,
      bgcolor: bg, color: colour ?? C.brown, borderRadius: 1.5, border: dashed ? `1.5px dashed ${C.midBlue}` : "none",
      display: "flex", alignItems: "center", px: 0.75, overflow: "hidden",
    }}>
      <Typography noWrap sx={{ fontSize: 11, fontWeight: 700 }}>{text}</Typography>
    </Box>
  );

  return (
    <PromoBox
      icon={<TimelapseOutlinedIcon sx={{ fontSize: 18 }} />}
      title={promo.promo_name}
      tags={<>
        <Tag label={`${promo.discount_pct}% off`} />
        {planned && <Tag label={`Starts ${shortDate(promo.start_date)}`} />}
        {end && <Tag dark label={`Ends around ${shortDate(end)}`} />}
      </>}
    >
      {!s ? <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2 }} /> : (
        <>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.75, lineHeight: 1.35 }}>{sentence}</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "70px 1fr", columnGap: 1, rowGap: 0.75, alignItems: "center" }}>
            {/* Last year */}
            {lyFrom && lyTo && <>
              <Label>Last year</Label>
              <Box sx={{ position: "relative", height: 22, bgcolor: "rgba(56, 35, 34, 0.04)", borderRadius: 1.5 }}>
                <Segment a={lyFrom} b={lyTo} bg="rgba(56, 35, 34, 0.14)"
                         text={`${longDate(s.ly_start)} – ${longDate(s.ly_end)} · ${count(s.ly_orders_per_day)} a day`} />
              </Box>
            </>}

            {/* This year: so far, then the forecast */}
            <Label>This year</Label>
            <Box sx={{ position: "relative", height: 22, bgcolor: "rgba(56, 35, 34, 0.04)", borderRadius: 1.5 }}>
              {!planned && Number(s.days_so_far ?? 0) > 0 && (
                <Segment a={promo.start_date} b={addDays(today, -1)} bg={C.brown} colour={C.cream}
                         text={`So far · ${count(s.orders_per_day)} a day`} />
              )}
              {end && Number(s.remaining_days ?? 0) > 0 && (
                <Segment a={planned ? promo.start_date : today} b={end} bg={alpha(C.midBlue, 0.5)} dashed
                         text={`Forecast · ~${count(perDayAhead)} a day`} />
              )}
              {today >= from && today <= to && (
                <Box sx={{ position: "absolute", top: -4, bottom: -4, left: `${pos(today)}%`, width: 2, bgcolor: C.down }} />
              )}
            </Box>

            {/* Dates under the timeline */}
            <Box />
            <Box sx={{ position: "relative", height: 14 }}>
              <Typography sx={{ position: "absolute", left: 0, fontSize: 11, fontWeight: 600, color: "text.secondary" }}>{shortDate(from)}</Typography>
              {today > from && today < to && (
                <Typography sx={{ position: "absolute", left: `${pos(today)}%`, transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: C.down }}>Today</Typography>
              )}
              <Typography sx={{ position: "absolute", right: 0, fontSize: 11, fontWeight: 600, color: "text.secondary" }}>{shortDate(to)}</Typography>
            </Box>
          </Box>

          {/* Totals */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1, mt: 0.75 }}>
            <Box><Label>Orders so far</Label><Value small>{count(s.orders_so_far)}</Value></Box>
            <Box><Label>Avg spend</Label><Value small>{rand(s.avg_value)}</Value></Box>
            <Box><Label>Days left</Label><Value small>{end ? count(s.remaining_days) : "–"}</Value></Box>
            <Box><Label>Still to come</Label><Value small>{end ? `~${count(s.forecast_orders)}` : "–"}</Value></Box>
          </Box>
        </>
      )}
    </PromoBox>
  );
};


/*
   DEMAND FORECAST PAGE
   Key figures and the chart fit on the screen, the promotions are just below (a short scroll)
 */

//Demand forecast page: a summary, key figures, orders per day and running promotions
export const DemandForecastPage = () => {
  const options = useRpc<PromoOption>("kpi_forecast_options", {});
  const combined = useRpc<CombinedDay>("kpi_forecast_combined", {});
  const history = useRpc<HistoryDay>("kpi_forecast_history", {});
  const accuracy = useRpc<Accuracy>("kpi_forecast_accuracy", {});
  const busy = useRpc<BusyHour>("kpi_forecast_busy_hours", {});
  const periods = useRpc<PeriodRow>("kpi_forecast_periods", {});

  //The next 7 days (the first day is today)
  const week = (combined.data ?? []).slice(0, 7);
  const today = week[0]?.day;
  const sum = (key: "forecast_orders" | "forecast_low" | "forecast_high" | "forecast_revenue") =>
    week.reduce((a, d) => a + Number(d[key] ?? 0), 0);
  const weekOrders = sum("forecast_orders");
  const weekRevenue = sum("forecast_revenue");
  const busiest = week.reduce<CombinedDay | null>((b, d) => (!b || Number(d.forecast_orders) > Number(b.forecast_orders) ? d : b), null);
  const peak = busiest ? peakWindow((busy.data ?? []).filter((r) => r.day === busiest.day)) : null;
  const acc = accuracy.data?.[0];
  const periodMessage = nextPeriodMessage(periods.data ?? [], today);

  //Running or planned promotions
  const promos = (options.data ?? []).filter((o) => o.status !== "ended");
  const weekly = promos.filter((o) => o.promo_type === "weekly");
  const ongoing = promos.filter((o) => o.promo_type === "ongoing");

  //Admin accounts have no restaurant of their own
  const noRestaurant = options.error?.includes("Choose a restaurant") || options.error?.includes("not linked");
  const failed = !noRestaurant ? options.error ?? combined.error : null;

  return (
    <Box sx={{
      px: SIDE_MARGIN,
      pb: 3,
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      color: C.brown,
    }}>
      {/* Page heading with the beta label, same as the other pages */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography sx={pageTitle}>Demand Forecast</Typography>
            <Chip size="small" label="BETA" sx={{ height: 22, fontSize: 11, fontWeight: 800, letterSpacing: 1, bgcolor: C.yellow, color: C.brown, border: `1px solid ${alpha(C.brown, 0.25)}` }} />
          </Box>
          <Typography sx={pageSubtitle}>What to expect over the next weeks, based on your own sales up to today</Typography>
        </Box>
        {/* Beta notice: this page is a proposal and the forecasts are estimates */}
        <Tooltip title="The forecasts are worked out from your own past sales. We're still testing and improving them, so numbers and features on this page may change. Use them as a guide alongside your own experience.">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, border: `1px dashed ${alpha(C.brown, 0.35)}`, borderRadius: 999, px: 1.5, py: 0.5, bgcolor: "#fff", cursor: "help" }}>
            <ScienceOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Beta proposal: estimates, not guarantees</Typography>
          </Box>
        </Tooltip>
      </Box>

      {noRestaurant && <Alert severity="info" sx={{ borderRadius: 3, flexShrink: 0 }}>Forecasts show here when you log in with a vendor account.</Alert>}
      {failed && <Alert severity="error" sx={{ borderRadius: 3, flexShrink: 0 }}>Could not load the forecast: {failed}</Alert>}
      {combined.loading && !noRestaurant && <Skeleton variant="rounded" sx={{ flex: 1, borderRadius: 4 }} />}

      {combined.data && week.length > 0 && today && (
        <>
          {/* One-line summary */}
          <SummaryLine week={weekOrders} busiest={busiest} peak={peak} nextPeriod={periodMessage ? periodMessage.split(".")[0] + "." : null} />

          {/* Key figures */}
          <Box sx={{ flexShrink: 0, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" } }}>
            <Kpi highlight label="Orders, next 7 days" value={`~${count(weekOrders)}`} sub={`Likely ${count(sum("forecast_low"))} – ${count(sum("forecast_high"))}`} />
            <Kpi label="Revenue, next 7 days" value={`~${rand(weekRevenue)}`} sub={weekOrders ? `Avg transaction ${rand(weekRevenue / weekOrders)}` : undefined} />
            <Kpi label="Busiest day" value={busiest ? shortDate(busiest.day) : "–"} sub={busiest ? `~${count(busiest.forecast_orders)} orders` : undefined} />
            <Kpi label="Forecast accuracy" value={acc?.accuracy_pct != null ? `${acc.accuracy_pct}%` : "–"}
                 sub={acc?.accuracy_pct != null ? `Last week: forecast ${count(acc.forecast_orders)}, actual ${count(acc.actual_orders)}` : "No sales last week to compare with"} />
          </Box>

          {/* Chart, then the promotions underneath. The chart's height leaves the promotions just below the screen edge */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ height: { xs: 300, lg: `calc(100dvh - ${LAYOUT_OFFSET_PX + 330}px)` }, minHeight: 280, display: "flex", flexDirection: "column" }}>
            <Panel grow icon={<ShowChartOutlinedIcon fontSize="small" />} title="Orders per day" tags={<Tag label="Last 4 weeks + next 2 weeks" />}
                   subtitle="Solid line: what happened. Dashed line: the forecast, with the likely range shaded.">
              {history.data ? <OrdersChart history={history.data} forecast={combined.data} /> : <Skeleton variant="rounded" height="100%" sx={{ borderRadius: 3 }} />}
            </Panel>
            </Box>

            {/* Running or planned promotions */}
            <Panel icon={<LocalOfferOutlinedIcon fontSize="small" />} title="Your promotions"
                   tags={promos.length ? <Tag label={`${promos.length} running or planned`} /> : undefined}>
              {options.data && promos.length === 0 && (
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>You have no running or planned promotions right now.</Typography>
              )}
              {/* Promotions side by side when there is room */}
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
                {ongoing.map((p) => <OngoingPromo key={p.promo_id} promo={p} today={today} />)}
                {weekly.map((p) => <WeeklyPromo key={p.promo_id} promo={p} />)}
              </Box>
            </Panel>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DemandForecastPage;