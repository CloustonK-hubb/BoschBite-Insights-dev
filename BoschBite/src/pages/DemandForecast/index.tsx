import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import { alpha } from "@mui/material/styles";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { useRpc } from "../../hooks/useRpc";
import { insightsColours, pageTitle, pageSubtitle } from "../../providers/theme";


/*
   SETTINGS
   Colours come from providers/theme.ts, shared with the dashboard and leaderboard
 */

const C = insightsColours;

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

//A promotion the restaurant is likely to run soon, learnt from the same period in earlier years
type Upcoming = {
  period_name: string;
  period_type: string;
  promo_type: "weekly" | "ongoing";
  discount_pct: number;
  promo_weekday: number | null;
  predicted_start: string;
  predicted_end: string;
  length_days: number;
  years_with: number;
  years_total: number;
  last_year_seen: number;
  orders_per_day: number | null;
  avg_value: number | null;
  expected_orders: number | null;
};

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

//One discount level in the same kind of academic period as today
type DiscountRow = { period_type: string; discount_pct: number; days_used: number; orders_per_day: number; revenue_per_day: number; avg_value: number };

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


/*
   BUILDING BLOCKS
   Same look as the list, show and People pages: white rounded cards with a soft shadow,
   small capital labels and one size for the numbers
 */

//Thin outline used around the smaller boxes inside a card
const OUTLINE = "1px solid rgba(56, 35, 34, 0.12)";

//Small capital label above a number or a column (same as the column labels in the tables)
const Label = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "text.secondary" }}>
    {children}
  </Typography>
);

//The one size used for the numbers on this page
const Value = ({ children, small }: { children: ReactNode; small?: boolean }) => (
  <Typography sx={{ fontSize: small ? 18 : 26, fontWeight: 800, color: C.brown, lineHeight: 1.2 }}>{children}</Typography>
);

//Small tag next to a section title
const Tag = ({ label, dark }: { label: string; dark?: boolean }) => (
  <Chip size="small" label={label} sx={{ height: 22, fontSize: 12, fontWeight: 700, bgcolor: dark ? C.brown : C.cream, color: dark ? C.cream : C.brown }} />
);

//White rounded card with a soft shadow, an icon, a title and tags
const Section = ({ icon, title, tags, subtitle, children }: {
  icon: ReactNode; title: string; tags?: ReactNode; subtitle?: string; children: ReactNode;
}) => (
  <Box sx={{ bgcolor: "#fff", borderRadius: 4, boxShadow: SHADOW, p: { xs: 2.5, md: 3 }, mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mb: subtitle ? 0.5 : 2 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.cream, color: C.brown }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.brown }}>{title}</Typography>
      {tags}
    </Box>
    {subtitle && <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 2 }}>{subtitle}</Typography>}
    {children}
  </Box>
);

//Equal boxes in a row; the highlighted one (the forecast) is yellow
const Boxes = ({ columns, children }: { columns: number; children: ReactNode }) => (
  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, minmax(0, 1fr))` } }}>{children}</Box>
);
const StatBox = ({ highlight, children }: { highlight?: boolean; children: ReactNode }) => (
  <Box sx={{ p: 2, borderRadius: 3, bgcolor: highlight ? C.yellow : "#fff", border: highlight ? "1px solid transparent" : OUTLINE, minWidth: 0 }}>
    {children}
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
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
      {hours.map((h) => <Chip key={h} size="small" label={h} sx={{ height: 22, fontSize: 12, fontWeight: 700, bgcolor: alpha(C.blue, 0.6) }} />)}
    </Box>
  ) : <Value small>–</Value>;

//One column of figures for a moment in time (last week, so far, next ...)
const Moment = ({ heading, sub, highlight, big, bigLabel, change, avg, hours, total }: {
  heading: string; sub?: string; highlight?: boolean; big: string; bigLabel: string;
  change?: ReactNode; avg: string; hours: string[]; total?: string;
}) => (
  <StatBox highlight={highlight}>
    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{heading}</Typography>
    {sub && <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{sub}</Typography>}
    <Box sx={{ mt: 1.5 }}><Label>{bigLabel}</Label><Value>{big}</Value>{change}</Box>
    <Box sx={{ mt: 1.5 }}><Label>Avg transaction</Label><Value small>{avg}</Value></Box>
    <Box sx={{ mt: 1.5 }}><Label>Popular hours</Label><Hours hours={hours} /></Box>
    {total && <Box sx={{ mt: 1.5 }}><Label>Total orders</Label><Value small>{total}</Value></Box>}
  </StatBox>
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
    <Section
      icon={<EventRepeatOutlinedIcon fontSize="small" />}
      title={promo.promo_name}
      tags={<>
        <Tag label={`Every ${weekday}`} />
        <Tag label={`${promo.discount_pct}% off`} />
        {promo.status === "planned" && <Tag label="Planned" dark />}
        {promo.status === "ended" && <Tag label={`Last ran ${shortDate(promo.end_date)}`} dark />}
      </>}
    >
      {!s ? <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} /> : !s.next_date ? (
        <Typography sx={{ fontSize: 14 }}>This promotion has no more {weekday}s coming up.</Typography>
      ) : (
        <Boxes columns={2}>
          <Moment heading={`Last ${weekday}`} sub={shortDate(s.last_week_date)}
                  big={count(s.last_week_orders)} bigLabel="Orders"
                  avg={rand(s.last_week_avg_value)} hours={topHours(hours, "compare_orders")} />
          <Moment highlight heading={`Next ${weekday}`} sub={`${shortDate(s.next_date)} · forecast`}
                  big={`~${count(s.forecast_orders)}`} bigLabel="Orders"
                  change={<Change now={s.forecast_orders} before={s.last_week_orders} unit="vs last week" />}
                  avg={`~${rand(s.avg_value)}`} hours={topHours(hours, "forecast_orders")} />
        </Boxes>
      )}
    </Section>
  );
};


/*
   SUMMARY AND KEY FIGURES
 */

//One-line summary at the top of the page
const SummaryLine = ({ week, busiest, peak, nextPeriod }: {
  week: number; busiest: CombinedDay | null; peak: [number, number] | null; nextPeriod: string | null;
}) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", bgcolor: C.blue, borderRadius: 4, px: 2.5, py: 1.75, mb: 3 }}>
    <LightbulbOutlinedIcon sx={{ mt: 0.25 }} />
    <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
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
  <Box sx={{ bgcolor: highlight ? C.yellow : "#fff", borderRadius: 4, boxShadow: SHADOW, px: 2.5, py: 2, minWidth: 0 }}>
    <Label>{label}</Label>
    <Value>{value}</Value>
    {sub && <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>{sub}</Typography>}
  </Box>
);


/*
   ORDERS PER DAY CHART
   Last 4 weeks (solid line) and the next 2 weeks (dashed line with the likely range)
 */

const CHART = { w: 1000, h: 260, left: 40, right: 12, top: 14, bottom: 30 };

const OrdersChart = ({ history, forecast }: { history: HistoryDay[]; forecast: CombinedDay[] }) => {
  const days = [
    ...history.map((h) => ({ day: h.day, actual: Number(h.orders), fc: null as number | null, lo: null as number | null, hi: null as number | null, weekly: h.has_weekly, period: h.period_type })),
    ...forecast.map((f) => ({ day: f.day, actual: null as number | null, fc: Number(f.forecast_orders ?? 0), lo: Number(f.forecast_low ?? 0), hi: Number(f.forecast_high ?? 0), weekly: f.has_weekly, period: f.period_type })),
  ];
  if (!days.length) return null;

  //Scale: rounded up to a tidy number so the grid lines are whole numbers
  const top = Math.max(...days.map((d) => Math.max(d.actual ?? 0, d.hi ?? 0, d.fc ?? 0)), 4);
  const step = Math.max(1, Math.ceil(top / 4 / 5) * 5);
  const maxY = step * 4;
  const x = (i: number) => CHART.left + (i * (CHART.w - CHART.left - CHART.right)) / Math.max(1, days.length - 1);
  const y = (v: number) => CHART.top + (CHART.h - CHART.top - CHART.bottom) * (1 - v / maxY);
  const todayIndex = history.length;
  const slot = (CHART.w - CHART.left - CHART.right) / Math.max(1, days.length - 1);

  //The solid line ends at the first forecast day so the two lines join up
  const actualPath = days.slice(0, todayIndex).map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.actual ?? 0)}`).join("");
  const joinFrom = todayIndex > 0 ? `M${x(todayIndex - 1)},${y(days[todayIndex - 1].actual ?? 0)}` : "";
  const forecastPath = joinFrom + days.slice(todayIndex).map((d, i) => `${!joinFrom && !i ? "M" : "L"}${x(todayIndex + i)},${y(d.fc ?? 0)}`).join("");
  const band = days.slice(todayIndex);
  const bandPath = band.length
    ? band.map((d, i) => `${i ? "L" : "M"}${x(todayIndex + i)},${y(d.hi ?? 0)}`).join("")
      + [...band].reverse().map((d, i) => `L${x(todayIndex + band.length - 1 - i)},${y(d.lo ?? 0)}`).join("") + "Z"
    : "";

  return (
    <>
      <Box component="svg" viewBox={`0 0 ${CHART.w} ${CHART.h}`} sx={{ width: "100%", height: "auto", display: "block" }}>
        {/* Exam days shaded yellow */}
        {days.map((d, i) => d.period === "Exams" && (
          <rect key={`e${d.day}`} x={x(i) - slot / 2} y={CHART.top} width={slot} height={CHART.h - CHART.top - CHART.bottom} fill={alpha(C.yellow, 0.7)} />
        ))}
        {/* Grid lines and numbers */}
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={CHART.left} x2={CHART.w - CHART.right} y1={y(k * step)} y2={y(k * step)} stroke="rgba(56, 35, 34, 0.08)" />
            <text x={CHART.left - 8} y={y(k * step) + 4} textAnchor="end" fontSize={11} fill="rgba(56, 35, 34, 0.6)">{k * step}</text>
          </g>
        ))}
        {/* Likely range, forecast and actual orders */}
        {bandPath && <path d={bandPath} fill={alpha(C.midBlue, 0.2)} />}
        <path d={actualPath} fill="none" stroke={C.brown} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={forecastPath} fill="none" stroke={C.midBlue} strokeWidth={2.5} strokeDasharray="6 5" strokeLinejoin="round" />
        {/* Weekly promotion days */}
        {days.map((d, i) => d.weekly && (
          <circle key={`w${d.day}`} cx={x(i)} cy={y(d.actual ?? d.fc ?? 0)} r={4.5} fill={C.down} />
        ))}
        {/* Today */}
        <line x1={x(todayIndex)} x2={x(todayIndex)} y1={CHART.top} y2={CHART.h - CHART.bottom} stroke={C.down} strokeDasharray="3 3" />
        <text x={x(todayIndex) + 5} y={CHART.top + 11} fontSize={11} fontWeight={700} fill={C.down}>Today</text>
        {/* Mondays on the bottom axis */}
        {days.map((d, i) => dateParts(d.day).weekday === "Mon" && (
          <text key={`m${d.day}`} x={x(i)} y={CHART.h - 10} textAnchor="middle" fontSize={11} fill="rgba(56, 35, 34, 0.6)">
            {dateParts(d.day).day} {dateParts(d.day).month}
          </text>
        ))}
      </Box>
      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
        {[
          { label: "Actual orders", colour: C.brown },
          { label: "Forecast", colour: C.midBlue },
          { label: "Likely range", colour: alpha(C.midBlue, 0.2) },
          { label: "Exams", colour: alpha(C.yellow, 0.9) },
          { label: "Weekly promotion day", colour: C.down, round: true },
        ].map((l) => (
          <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: l.round ? 10 : 14, height: 10, borderRadius: l.round ? "50%" : 0.75, bgcolor: l.colour }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{l.label}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
};


/*
   BUSY HOURS
   Pick a day to see its expected orders per hour, the 2 busiest hours in a row are highlighted
 */

const BusyHours = ({ rows, days, busiest }: { rows: BusyHour[]; days: CombinedDay[]; busiest: string | null }) => {
  //The chosen day starts on the busiest day of the week
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? busiest ?? days[0]?.day ?? null;
  if (!rows.length || !day) return <Typography sx={{ fontSize: 14 }}>Not enough sales in the last 8 weeks to show busy hours.</Typography>;

  //Same hours and the same scale for every day, so the days can be compared
  const hours: number[] = [];
  const first = Math.min(...rows.map((r) => r.hour_of_day));
  const last = Math.max(...rows.map((r) => r.hour_of_day));
  for (let h = first; h <= last; h++) hours.push(h);
  const max = Math.max(...rows.map((r) => Number(r.forecast_orders)), 1);
  const dayRows = rows.filter((r) => r.day === day);
  const value = new Map(dayRows.map((r) => [r.hour_of_day, Number(r.forecast_orders)]));
  const peak = peakWindow(dayRows);
  const shown = (v: number) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1));

  return (
    <Box>
      {/* Day tabs */}
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
        {days.slice(0, 7).map((d) => {
          const on = d.day === day;
          return (
            <Chip key={d.day} size="small" clickable onClick={() => setPicked(d.day)}
                  label={`${dateParts(d.day).weekday} ${dateParts(d.day).day}`}
                  sx={{ fontWeight: 700, fontSize: 12, bgcolor: on ? C.brown : C.cream, color: on ? C.cream : C.brown,
                        "&:hover": { bgcolor: on ? C.brown : alpha(C.brown, 0.15) } }} />
          );
        })}
      </Box>

      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>
        {shortDate(day)}{peak ? ` · busiest ${hourLabel(peak[0])}–${hourLabel(peak[1] + 1)}` : ""}
      </Typography>

      {/* One bar per hour */}
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))`, gap: 0.5, alignItems: "end", height: 150 }}>
        {hours.map((h) => {
          const v = value.get(h) ?? 0;
          const inPeak = !!peak && (h === peak[0] || h === peak[1]);
          return (
            <Box key={h} title={`${hourLabel(h)}: about ${shown(v)} orders`}
                 sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
              {v > 0 && <Typography sx={{ fontSize: 10, fontWeight: 700, color: inPeak ? C.brown : "text.secondary", mb: 0.25 }}>{shown(v)}</Typography>}
              <Box sx={{ width: "100%", height: `${(v / max) * 120}px`, minHeight: v > 0 ? 3 : 0, borderRadius: "4px 4px 0 0",
                         bgcolor: inPeak ? C.brown : alpha(C.midBlue, 0.55) }} />
            </Box>
          );
        })}
      </Box>
      {/* Hours under the bars */}
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))`, gap: 0.5, mt: 0.5, borderTop: OUTLINE, pt: 0.5 }}>
        {hours.map((h, i) => (
          <Typography key={h} sx={{ fontSize: 10, color: "text.secondary", textAlign: "center" }}>{i % 2 === 0 ? String(h).padStart(2, "0") : ""}</Typography>
        ))}
      </Box>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}>
        Expected orders per hour. The hours add up to that day's forecast.
      </Typography>
    </Box>
  );
};


/*
   DISCOUNT COMPARISON
   How each discount did in the same kind of academic period as now
 */

const Discounts = ({ rows }: { rows: DiscountRow[] }) => {
  if (!rows.length) {
    return <Typography sx={{ fontSize: 14 }}>No discount was used on 5 or more days in this kind of period yet, so there is nothing to compare.</Typography>;
  }
  const maxOrders = Math.max(...rows.map((r) => Number(r.orders_per_day)), 1);
  const maxRevenue = Math.max(...rows.map((r) => Number(r.revenue_per_day)), 1);
  const best = rows.reduce((b, r) => (Number(r.revenue_per_day) > Number(b.revenue_per_day) ? r : b), rows[0]);

  //One thin bar with its number on the right
  const Bar = ({ value, max, colour, text }: { value: number; max: number; colour: string; text: string }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 64px", gap: 1, alignItems: "center" }}>
      <Box sx={{ height: 10, borderRadius: 5, bgcolor: "rgba(56, 35, 34, 0.06)" }}>
        <Box sx={{ height: "100%", width: `${(value / max) * 100}%`, borderRadius: 5, bgcolor: colour }} />
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 800, textAlign: "right" }}>{text}</Typography>
    </Box>
  );

  return (
    <Box>
      {/* Column labels */}
      <Box sx={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr", gap: 2, px: 1.5, pb: 1 }}>
        <Label>Discount</Label><Label>Orders a day</Label><Label>Revenue a day</Label>
      </Box>
      {rows.map((r) => {
        const isBest = r === best;
        return (
          <Box key={r.discount_pct} sx={{
            display: "grid", gridTemplateColumns: "72px 1fr 1fr", gap: 2, alignItems: "center",
            px: 1.5, py: 1, mb: 0.75, borderRadius: 3,
            bgcolor: isBest ? C.yellow : "#fff", border: isBest ? "1px solid transparent" : OUTLINE,
          }}>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{r.discount_pct}% off</Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600 }}>{r.days_used} days</Typography>
            </Box>
            <Bar value={Number(r.orders_per_day)} max={maxOrders} colour={C.midBlue} text={String(r.orders_per_day)} />
            <Bar value={Number(r.revenue_per_day)} max={maxRevenue} colour={C.brown} text={rand(r.revenue_per_day)} />
          </Box>
        );
      })}
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.up, mt: 1 }}>
        {best.discount_pct}% off brought in the most revenue a day ({rand(best.revenue_per_day)}, avg transaction {rand(best.avg_value)}).
      </Typography>
    </Box>
  );
};


/*
   ACADEMIC CALENDAR EFFECT
   Average orders a day in lectures, exams and recess over the last year
 */

const Periods = ({ rows, message }: { rows: PeriodRow[]; message: string | null }) => (
  <>
    <Boxes columns={3}>
      {rows.map((p) => (
        <StatBox key={p.period_type} highlight={p.is_current}>
          <Label>{p.period_type}{p.is_current ? " · on now" : p.next_start ? ` · next starts ${shortDate(p.next_start)}` : ""}</Label>
          <Value>{p.orders_per_day == null ? "–" : String(p.orders_per_day)}</Value>
          {p.orders_per_day == null ? (
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>No sales in this kind of period yet</Typography>
          ) : p.change_vs_lectures_pct != null ? (
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: p.change_vs_lectures_pct >= 0 ? C.up : C.down }}>
              {p.change_vs_lectures_pct >= 0 ? "▲" : "▼"} {Math.abs(Number(p.change_vs_lectures_pct))}% vs lectures
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>Orders a day ({p.days} days)</Typography>
          )}
        </StatBox>
      ))}
    </Boxes>
    {message && (
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, bgcolor: alpha(C.blue, 0.35) }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{message}</Typography>
      </Box>
    )}
  </>
);

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
   A timeline of last year's promotion above this one: so far and the forecast for the rest
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
      bgcolor: bg, color: colour ?? C.brown, borderRadius: 2, border: dashed ? "1px dashed #d8b850" : "none",
      display: "flex", alignItems: "center", px: 1.25, overflow: "hidden",
    }}>
      <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>{text}</Typography>
    </Box>
  );

  return (
    <Section
      icon={<TimelapseOutlinedIcon fontSize="small" />}
      title={promo.promo_name}
      tags={<>
        <Tag label={`${promo.discount_pct}% off`} />
        {planned && <Tag label={`Starts ${shortDate(promo.start_date)}`} />}
        {end && <Tag dark label={`Ends around ${shortDate(end)}`} />}
      </>}
    >
      {!s ? <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /> : (
        <>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", mb: 2 }}>
            <HistoryOutlinedIcon fontSize="small" sx={{ mt: 0.25, color: "text.secondary" }} />
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{sentence}</Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "80px 1fr", sm: "110px 1fr" }, gap: 1.5, alignItems: "center" }}>
            {/* Last year */}
            {lyFrom && lyTo && <>
              <Label>Last year</Label>
              <Box sx={{ position: "relative", height: 30, bgcolor: "rgba(56, 35, 34, 0.04)", borderRadius: 2 }}>
                <Segment a={lyFrom} b={lyTo} bg="rgba(56, 35, 34, 0.14)"
                         text={`${longDate(s.ly_start)} – ${longDate(s.ly_end)} · ${s.ly_days} days · ${count(s.ly_orders_per_day)} orders a day`} />
              </Box>
            </>}

            {/* This year: so far, then the forecast */}
            <Label>This year</Label>
            <Box sx={{ position: "relative", height: 30, bgcolor: "rgba(56, 35, 34, 0.04)", borderRadius: 2 }}>
              {!planned && Number(s.days_so_far ?? 0) > 0 && (
                <Segment a={promo.start_date} b={addDays(today, -1)} bg={C.brown} colour={C.cream}
                         text={`So far · ${count(s.orders_per_day)} a day`} />
              )}
              {end && Number(s.remaining_days ?? 0) > 0 && (
                <Segment a={planned ? promo.start_date : today} b={end} bg={C.yellow} dashed
                         text={`Forecast · ~${count(perDayAhead)} a day`} />
              )}
              {today >= from && today <= to && (
                <Box sx={{ position: "absolute", top: -6, bottom: -6, left: `${pos(today)}%`, width: 2, bgcolor: C.down }} />
              )}
            </Box>

            {/* Dates under the timeline */}
            <Box />
            <Box sx={{ position: "relative", height: 18 }}>
              <Typography sx={{ position: "absolute", left: 0, fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{shortDate(from)}</Typography>
              {today > from && today < to && (
                <Typography sx={{ position: "absolute", left: `${pos(today)}%`, transform: "translateX(-50%)", fontSize: 12, fontWeight: 700, color: C.down }}>Today</Typography>
              )}
              <Typography sx={{ position: "absolute", right: 0, fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{shortDate(to)}</Typography>
            </Box>
          </Box>

          {/* Totals */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" }, gap: 1.5, mt: 2 }}>
            <Box><Label>Orders so far</Label><Value small>{count(s.orders_so_far)}</Value></Box>
            <Box><Label>Avg transaction</Label><Value small>{rand(s.avg_value)}</Value></Box>
            <Box><Label>Days left</Label><Value small>{end ? count(s.remaining_days) : "–"}</Value></Box>
            <Box><Label>Orders still to come</Label><Value small>{end ? `~${count(s.forecast_orders)}` : "–"}</Value></Box>
          </Box>
        </>
      )}
    </Section>
  );
};


/*
   LIKELY UPCOMING PROMOTIONS
   Promotions the restaurant ran in the same period in earlier years
 */

const LikelyNext = ({ rows }: { rows: Upcoming[] }) => (
  <Section icon={<AutoAwesomeOutlinedIcon fontSize="small" />} title="Promotions you're likely to run next" tags={<Tag label="From earlier years" />}
           subtitle="Based on the lectures, exams and recess periods in the next 60 days">
    {rows.length ? (
      <Boxes columns={2}>
        {rows.map((u) => (
          <StatBox key={`${u.period_name}-${u.promo_type}`}>
            <Tag label={`${u.period_type}: ${u.period_name}`} />
            <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 1 }}>
              {u.promo_type === "weekly" ? `Weekly ${u.discount_pct}% off on ${WEEKDAYS[u.promo_weekday ?? 0]}s` : `Ongoing ${u.discount_pct}% off`}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", fontWeight: 600 }}>
              Likely {shortDate(u.predicted_start)} – {shortDate(u.predicted_end)}{u.promo_type === "ongoing" ? ` (${u.length_days} days)` : ""}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1.5 }}>
              <Box><Label>Expected orders</Label><Value small>~{count(u.expected_orders)}</Value></Box>
              <Box><Label>Avg transaction</Label><Value small>~{rand(u.avg_value)}</Value></Box>
            </Box>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}>
              You ran this in {u.years_with} of the last {u.years_total} years (most recently {u.last_year_seen}).
            </Typography>
          </StatBox>
        ))}
      </Boxes>
    ) : (
      <Typography sx={{ fontSize: 14 }}>You haven't run promotions in these periods in earlier years, so there is nothing to predict yet.</Typography>
    )}
    <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1.5 }}>
      One-day promotions can't be predicted, because only promotions of 5 or more days, or 4 or more weeks in a row, are recorded.
    </Typography>
  </Section>
);


/*
   DEMAND FORECAST PAGE
 */

//Demand forecast page: a summary, key figures, orders per day, busy hours, the discount comparison,
//the academic calendar effect, running promotions and the promotions likely to come
export const DemandForecastPage = () => {
  const options = useRpc<PromoOption>("kpi_forecast_options", {});
  const combined = useRpc<CombinedDay>("kpi_forecast_combined", {});
  const history = useRpc<HistoryDay>("kpi_forecast_history", {});
  const accuracy = useRpc<Accuracy>("kpi_forecast_accuracy", {});
  const busy = useRpc<BusyHour>("kpi_forecast_busy_hours", {});
  const discounts = useRpc<DiscountRow>("kpi_forecast_discounts", {});
  const periods = useRpc<PeriodRow>("kpi_forecast_periods", {});
  const upcoming = useRpc<Upcoming>("kpi_forecast_upcoming", {});

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
  const periodType = discounts.data?.[0]?.period_type ?? week[0]?.period_type ?? "Lectures";

  //Running or planned promotions
  const promos = (options.data ?? []).filter((o) => o.status !== "ended");
  const weekly = promos.filter((o) => o.promo_type === "weekly");
  const ongoing = promos.filter((o) => o.promo_type === "ongoing");

  //Admin accounts have no restaurant of their own
  const noRestaurant = options.error?.includes("Choose a restaurant") || options.error?.includes("not linked");
  const failed = !noRestaurant ? options.error ?? combined.error : null;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 1, color: C.brown }}>
      {/* Page heading, same as the other pages */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Typography sx={pageTitle}>Demand forecast</Typography>
          {/* Beta label next to the title */}
          <Chip size="small" label="BETA" sx={{ height: 22, fontSize: 11, fontWeight: 800, letterSpacing: 1, bgcolor: C.yellow, color: C.brown, border: `1px solid ${alpha(C.brown, 0.25)}` }} />
        </Box>
        <Typography sx={pageSubtitle}>What to expect over the next weeks, based on your own sales up to today</Typography>
      </Box>

      {/* Beta notice: this page is a proposal and the forecasts are estimates */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", border: `1px dashed ${alpha(C.brown, 0.35)}`, borderRadius: 4, px: 2.5, py: 1.75, mb: 3, bgcolor: "#fff" }}>
        <ScienceOutlinedIcon sx={{ mt: 0.25, color: C.brown }} />
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>This page is a beta proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            The forecasts are estimates worked out from your own past sales, not guarantees. We're still testing and improving
            them, so numbers and features on this page may change. Use them as a guide alongside your own experience.
          </Typography>
        </Box>
      </Box>

      {noRestaurant && <Alert severity="info" sx={{ borderRadius: 3 }}>Forecasts show here when you log in with a vendor account.</Alert>}
      {failed && <Alert severity="error" sx={{ borderRadius: 3 }}>Could not load the forecast: {failed}</Alert>}
      {combined.loading && !noRestaurant && <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />}

      {combined.data && week.length > 0 && (
        <>
          {/* One-line summary */}
          <SummaryLine week={weekOrders} busiest={busiest} peak={peak} nextPeriod={periodMessage ? periodMessage.split(".")[0] + "." : null} />

          {/* Key figures */}
          <Box sx={{ display: "grid", gap: 2, mb: 3, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
            <Kpi highlight label="Orders, next 7 days" value={`~${count(weekOrders)}`} sub={`Likely ${count(sum("forecast_low"))} – ${count(sum("forecast_high"))}`} />
            <Kpi label="Revenue, next 7 days" value={`~${rand(weekRevenue)}`} sub={weekOrders ? `Avg transaction ${rand(weekRevenue / weekOrders)}` : undefined} />
            <Kpi label="Busiest day" value={busiest ? shortDate(busiest.day) : "–"} sub={busiest ? `~${count(busiest.forecast_orders)} orders` : undefined} />
            <Kpi label="Forecast accuracy" value={acc?.accuracy_pct != null ? `${acc.accuracy_pct}%` : "–"}
                 sub={acc?.accuracy_pct != null ? `Last week: forecast ${count(acc.forecast_orders)}, actual ${count(acc.actual_orders)}` : "No sales last week to compare with"} />
          </Box>

          {/* Orders per day */}
          <Section icon={<ShowChartOutlinedIcon fontSize="small" />} title="Orders per day" tags={<Tag label="Last 4 weeks + next 2 weeks" />}
                   subtitle="The solid line is what happened, the dashed line is the forecast and the shaded band is the likely range.">
            {history.data ? <OrdersChart history={history.data} forecast={combined.data} /> : <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />}
          </Section>

          {/* Busy hours and the discount comparison side by side */}
          <Box sx={{ display: "grid", gap: 3, mb: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, "& > *": { mb: "0 !important" } }}>
            <Section icon={<ScheduleOutlinedIcon fontSize="small" />} title="Busy hours this week" subtitle="Pick a day to see when it gets busy.">
              {busy.data ? <BusyHours rows={busy.data} days={week} busiest={busiest?.day ?? null} /> : <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />}
            </Section>
            <Section icon={<LocalOfferOutlinedIcon fontSize="small" />} title="Which discount works best"
                     subtitle={`Your average per day at each discount, on ${periodWord(periodType)} days in the last year.`}>
              {discounts.data ? <Discounts rows={discounts.data} /> : <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />}
            </Section>
          </Box>

          {/* Academic calendar effect */}
          {periods.data && (
            <Section icon={<SchoolOutlinedIcon fontSize="small" />} title="How the academic calendar affects you" tags={<Tag label="Average orders a day, last year" />}>
              <Periods rows={periods.data} message={periodMessage} />
            </Section>
          )}
        </>
      )}

      {/* Running or planned promotions */}
      {today && ongoing.map((p) => <OngoingPromo key={p.promo_id} promo={p} today={today} />)}
      {weekly.map((p) => <WeeklyPromo key={p.promo_id} promo={p} />)}

      {/* Promotions likely to come, learnt from earlier years */}
      {upcoming.data && options.data && <LikelyNext rows={upcoming.data} />}
    </Box>
  );
};

export default DemandForecastPage;