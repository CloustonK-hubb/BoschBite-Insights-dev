import { useMemo, useState, type ReactNode } from "react";
import {
  alpha,
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  BarPlot,
  ChartsAxisHighlight,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
  PieChart,
  ChartsContainer,
} from "@mui/x-charts";
import { rainbowSurgePalette } from "@mui/x-charts/colorPalettes";
import { useGo } from "@refinedev/core";
import { useRpc } from "../../hooks/useRpc";

/* ---------- layout ---------- */
// Height taken by Refine's top bar + the layout's own padding.
// If the page still scrolls (or leaves a gap at the bottom), adjust this number.
const LAYOUT_OFFSET_PX = 112;
// Extra white space left and right of the content
const SIDE_MARGIN = { xs: 1, md: 4, lg: 8 };

/* ---------- BoschBite palette ---------- */
const C = {
  blue: "#B1C8EA",
  yellow: "#FFEBAA",
  brown: "#382322",
  cream: "#FDEBDE",
  midBlue: "#5F7FB5",
  taupe: "#8A7370",
  border: "rgba(56,35,34,0.15)",
};
const DEFAULT = rainbowSurgePalette("light");
const CHART = { market: DEFAULT[0], you: DEFAULT[1] };
const EVENT_COLORS = { exam: DEFAULT[2], term: DEFAULT[3], event: DEFAULT[4] };

/* ---------- types returned by the SQL functions ---------- */
type Cards = {
  day: string;
  market_sales: number | null;
  market_sales_prev_week: number | null;
  market_orders: number;
  market_orders_prev_week: number;
  active_promos: number;
  new_promos_last_7_days: number;
  avg_promo_discount: number | null;
  your_score: number | null;
  your_rank: number | null;
  vendors_ranked: number;
  market_avg_score: number | null;
};
type VendorSlice = { label: string; orders: number; share_pct: number; is_you: boolean };
type HourRow = { hour: number; your_orders: number; market_avg_orders: number };
type WeekRow = { day: string; events: string[]; period_type: string | null };

/* ---------- date + number helpers (South African time) ---------- */
const saDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(d); // YYYY-MM-DD
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const longDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
const rand = (n: number | null | undefined) =>
  n == null ? "–" : new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
const count = (n: number | null | undefined) => (n == null ? "–" : new Intl.NumberFormat("en-ZA").format(n));
const change = (now?: number | null, before?: number | null) => {
  if (!now || !before) return null;
  const pct = Math.round(((Number(now) - Number(before)) / Number(before)) * 100);
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs same day last week`;
};
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/* ---------- small building blocks ---------- */
const Panel = ({ children }: { children: ReactNode }) => (
  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: C.border, height: "100%", minHeight: 0, display: "flex" }}>
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {children}
    </CardContent>
  </Card>
);

const Kpi = ({ title, value, note, badge, loading }: {
  title: string; value: string; note: string; badge?: string | null; loading: boolean;
}) => (
  <Panel>
    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
    {loading ? <Skeleton width="70%" height={44} /> : (
      <Typography variant="h4" fontWeight={900} letterSpacing={-1} lineHeight={1.15}>{value}</Typography>
    )}
    <Typography variant="body2" fontWeight={500}>{note}</Typography>
    {badge && <Chip label={badge} size="small" sx={{ mt: 1, alignSelf: "flex-start", bgcolor: C.cream, fontWeight: 700 }} />}
  </Panel>
);

const LegendKey = ({ colour, label, line }: { colour: string; label: string; line?: boolean }) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box sx={line
      ? { width: 18, height: 3, borderRadius: 2, bgcolor: colour }
      : { width: 12, height: 12, borderRadius: 1, bgcolor: colour }} />
    <Typography variant="body2" fontWeight={600}>{label}</Typography>
  </Stack>
);

/* ---------- the page ---------- */
export const DashboardPage = () => {
  const go = useGo();
  const push = (to: string) => go({ to });
  const [day, setDay] = useState(() => saDate(new Date(Date.now() - 864e5))); // yesterday
  const today = addDays(day, 1);

  const cards = useRpc<Cards>("bb_dashboard_cards", { p_day: day });
  const vendors = useRpc<VendorSlice>("bb_dashboard_orders_by_vendor", { p_day: day });
  const hours = useRpc<HourRow>("bb_dashboard_orders_by_hour", { p_day: day });
  const week = useRpc<WeekRow>("bb_dashboard_week", { p_today: today });

  const k = cards.data?.[0];
  const error = cards.error || vendors.error || hours.error || week.error;

  const pieData = useMemo(
    () => (vendors.data ?? []).map((s, i) => ({
      id: i, value: s.orders, label: `${s.label} · ${s.share_pct}%`,
    })),
    [vendors.data],
  );
  const totalOrders = (vendors.data ?? []).reduce((a, s) => a + s.orders, 0);

  const hourRows = (hours.data ?? []).filter((h) => h.hour >= 7 && h.hour <= 23);
  const yourPeak = hourRows.reduce<HourRow | null>((b, h) => (!b || h.your_orders > b.your_orders ? h : b), null);
  const marketPeak = hourRows.reduce<HourRow | null>(
    (b, h) => (!b || Number(h.market_avg_orders) > Number(b.market_avg_orders) ? h : b), null);

  return (
    <Box
      sx={{
        px: SIDE_MARGIN,
        height: `calc(100dvh - ${LAYOUT_OFFSET_PX}px)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        color: C.brown,
      }}
    >
      {/* header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" spacing={2} sx={{ flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Business dashboard</Typography>
          <Typography variant="body2" fontWeight={500}>
            Restaurants &amp; Cafés market on BoschCard · {longDay(day)} · other vendors stay anonymous
          </Typography>
        </Box>
        <TextField
          label="Showing"
          type="date"
          size="small"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ flexShrink: 0 }}>Could not load the dashboard: {error}</Alert>}

      {/* 4 cards */}
      <Box sx={{ flexShrink: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
        <Kpi loading={cards.loading} title="Total market sales" value={rand(k?.market_sales)}
             note="After discounts" badge={change(k?.market_sales, k?.market_sales_prev_week)} />
        <Kpi loading={cards.loading} title="Total orders" value={count(k?.market_orders)}
             note="BoschCard transactions" badge={change(k?.market_orders, k?.market_orders_prev_week)} />
        <Kpi loading={cards.loading} title="Active promotions" value={count(k?.active_promos)}
             note={`${count(k?.new_promos_last_7_days)} started in the last 7 days`}
             badge={k?.avg_promo_discount != null ? `Average discount ${k.avg_promo_discount}%` : null} />
        <Card sx={{ borderRadius: 4, bgcolor: C.yellow, boxShadow: "none" }}>
          <CardActionArea
            onClick={() => push("/leaderboard")}
            sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}
          >
            <Typography variant="subtitle2" fontWeight={700}>Your vendor score</Typography>
            {cards.loading ? <Skeleton width="60%" height={44} /> : (
              <Typography variant="h4" fontWeight={900} letterSpacing={-1} lineHeight={1.15}>
                {k?.your_score ?? "–"} <Typography component="span" variant="subtitle1" fontWeight={700}>/ 100</Typography>
              </Typography>
            )}
            <Typography variant="body2" fontWeight={600}>
              Rank {k?.your_rank ?? "–"} of {k?.vendors_ranked ?? "–"} · market average {k?.market_avg_score ?? "–"}
            </Typography>
            <Box sx={{ position: "relative", mt: 1.25 }}>
              <LinearProgress variant="determinate" value={Number(k?.your_score ?? 0)}
                sx={{ height: 8, borderRadius: 4, bgcolor: "#fff", "& .MuiLinearProgress-bar": { bgcolor: C.brown } }} />
              {k?.market_avg_score != null && (
                <Box sx={{ position: "absolute", top: -4, bottom: -4, left: `${k.market_avg_score}%`, borderLeft: `2px dashed ${C.brown}` }} />
              )}
            </Box>
            <Typography variant="body2" fontWeight={800} sx={{ mt: 1 }}>View leaderboard →</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* pie + hourly chart: this row takes whatever height is left */}
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" } }}>
        <Panel>
          <Typography variant="subtitle1" fontWeight={800}>Orders by vendor</Typography>
          <Typography variant="body2" fontWeight={500}>Share of {count(totalOrders)} restaurant &amp; café transactions</Typography>
          <Box sx={{ flex: 1, minHeight: 0, mt: 1 }}>
            {vendors.loading ? <Skeleton variant="circular" width={160} height={160} sx={{ m: "8px auto" }} /> : (
              <PieChart series={[{ data: pieData, innerRadius: "45%", paddingAngle: 1, cornerRadius: 3 }]} />
            )}
          </Box>
        </Panel>

        <Panel>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Orders by hour</Typography>
              <Typography variant="body2" fontWeight={500}>Your orders against the average restaurant &amp; café</Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <LegendKey colour={CHART.market} label="Market average" />
              <LegendKey colour={CHART.you} label="You" line />
            </Stack>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {hours.loading ? <Skeleton variant="rectangular" height="100%" sx={{ mt: 1, borderRadius: 2 }} /> : (
              <ChartsContainer
                margin={{ top: 16, right: 16, bottom: 28, left: 36 }}
                xAxis={[{ id: "hours", scaleType: "band", data: hourRows.map((h) => hh(h.hour)) }]}
                series={[
                  { type: "bar", data: hourRows.map((h) => Number(h.market_avg_orders)), label: "Market average", color: CHART.market },
                  { type: "line", data: hourRows.map((h) => h.your_orders), label: "You", color: CHART.you, curve: "monotoneX" },
                ]}
              >
                <BarPlot borderRadius={4} />
                <LinePlot />
                <MarkPlot />
                <ChartsXAxis axisId="hours" />
                <ChartsYAxis />
                <ChartsAxisHighlight x="band" />
                <ChartsTooltip trigger="axis" />
              </ChartsContainer>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {yourPeak && yourPeak.your_orders > 0 && (
              <Chip size="small" label={`Your busiest hour: ${hh(yourPeak.hour)} (${yourPeak.your_orders} orders)`}
                    sx={{ bgcolor: C.cream, fontWeight: 700 }} />
            )}
            {marketPeak && (
              <Chip size="small" label={`Market busiest hour: ${hh(marketPeak.hour)}`} sx={{ bgcolor: C.cream, fontWeight: 700 }} />
            )}
          </Stack>
        </Panel>
      </Box>

      {/* week strip */}
      <Box sx={{ flexShrink: 0 }}>
        <Panel>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1.25 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>This week on campus</Typography>
              <Typography variant="body2" fontWeight={500}>Today and the next 6 days. Plan staff and stock around these.</Typography>
            </Box>
            <Typography component="a" onClick={() => push("/CalendarPage")} sx={{ cursor: "pointer", fontWeight: 800, color: C.brown }}>
              Full calendar →
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
            {(week.data ?? []).map((d) => {
              const isToday = d.day === today;
              const date = new Date(`${d.day}T12:00:00Z`);
              return (
                <Box key={d.day} sx={{ bgcolor: C.cream, borderRadius: 3, p: 1.25, minHeight: 92, display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" fontWeight={800} letterSpacing={0.5}>
                      {date.toLocaleDateString("en-ZA", { weekday: "short", timeZone: "UTC" }).toUpperCase()}
                    </Typography>
                    {isToday
                      ? <Chip size="small" label={`Today ${date.getUTCDate()}`} sx={{ height: 20, bgcolor: C.brown, color: C.cream, fontWeight: 800 }} />
                      : <Typography variant="caption" fontWeight={700}>
                          {date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" })}
                        </Typography>}
                  </Stack>
                {d.events.map((e) => {
                  const kind = /exam/i.test(e) ? "exam" : /lecture|recess/i.test(e) ? "term" : "event";
                  const colour = EVENT_COLORS[kind];
                  return (
                    <Box key={e} title={e} sx={{
                      borderRadius: 2, px: 0.75, py: 0.25, fontSize: 12, fontWeight: 700, lineHeight: 1.3,
                      bgcolor: alpha(colour, 0.15),
                      borderLeft: `4px solid ${colour}`,
                      color: C.brown,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{e}</Box>
                  );
                })}
                </Box>
              );
            })}
          </Box>
        </Panel>
      </Box>
    </Box>
  );
};

export default DashboardPage;
