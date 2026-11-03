import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
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
import { insightsColours, chartColours, insightsLayout, pageTitle, pageSubtitle } from "../../providers/theme";
import { CalendarWeekStrip } from "../../components/CalendarWeekStrip";

/* ---------- layout + colours ---------- */
// Margins and colours now live in providers/theme.ts so the dashboard and leaderboard share them.
// Change them there, not here.
const LAYOUT_OFFSET_PX = insightsLayout.offsetPx;
const SIDE_MARGIN = insightsLayout.sideMargin;
const C = insightsColours;
const CHART = chartColours;
//Pie colours, the same MUI palette the pie used before, also used for its list of vendors
const PIE_COLOURS = rainbowSurgePalette("light");
//The "other vendors" slice
const OTHER_COLOUR = "#CFC6C3";

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

//Key figure card: kept compact so the charts below get more room
const Kpi = ({ title, value, note, badge, loading }: {
  title: string; value: string; note: string; badge?: string | null; loading: boolean;
}) => (
  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: C.border, height: "100%" }}>
    <CardContent sx={{ px: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
      <Typography variant="body2" fontWeight={700}>{title}</Typography>
      {loading ? <Skeleton width="70%" height={36} /> : (
        <Typography fontWeight={900} letterSpacing={-0.5} lineHeight={1.15} sx={{ fontSize: 28 }}>{value}</Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" fontWeight={500}>{note}</Typography>
        {badge && <Chip label={badge} size="small" sx={{ height: 22, bgcolor: C.cream, fontWeight: 700 }} />}
      </Box>
    </CardContent>
  </Card>
);

const LegendKey = ({ colour, label, line }: { colour: string; label: string; line?: boolean }) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box sx={line
      ? { width: 18, height: 3, borderRadius: 2, bgcolor: colour }
      : { width: 12, height: 12, borderRadius: 1, bgcolor: colour }} />
    <Typography variant="body2" fontWeight={600}>{label}</Typography>
  </Stack>
);

//Width and height of a box on the screen, so a chart can be drawn at exactly that size
const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
};

/* ---------- the page ---------- */
export const DashboardPage = () => {
  const go = useGo();
  const pieBox = useSize<HTMLDivElement>();
  const push = (to: string) => go({ to });
  const [day, setDay] = useState(() => saDate(new Date(Date.now() - 864e5))); // yesterday
  const today = addDays(day, 1);

  const cards = useRpc<Cards>("bb_dashboard_cards", { p_day: day });
  const vendors = useRpc<VendorSlice>("bb_dashboard_orders_by_vendor", { p_day: day });
  const hours = useRpc<HourRow>("bb_dashboard_orders_by_hour", { p_day: day });

  const k = cards.data?.[0];
  const error = cards.error || vendors.error || hours.error;

  //Pie slices: the top 3 vendors, you (when you're not in the top 3) and everyone else together
  const pieData = useMemo(() => {
    const sorted = [...(vendors.data ?? [])].sort((a, b) => b.orders - a.orders);
    const shown = sorted.slice(0, 3);
    const you = sorted.find((s) => s.is_you);
    if (you && !shown.includes(you)) shown.push(you);
    const rest = sorted.filter((s) => !shown.includes(s));
    //You always get the first colour, the other vendors the next ones
    let next = 1;
    const slices = shown.map((s, i) => ({
      id: i, value: s.orders, label: `${s.label} · ${s.share_pct}%`,
      colour: s.is_you ? PIE_COLOURS[0] : PIE_COLOURS[next++ % PIE_COLOURS.length], isYou: s.is_you,
    }));
    if (rest.length) {
      const share = Math.round(rest.reduce((a, s) => a + Number(s.share_pct), 0) * 10) / 10;
      slices.push({
        id: slices.length, value: rest.reduce((a, s) => a + s.orders, 0),
        label: `${rest.length} other vendors · ${share}%`, colour: OTHER_COLOUR, isYou: false,
      });
    }
    return slices;
  }, [vendors.data]);
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
          <Typography sx={pageTitle}>Business dashboard</Typography>
          <Typography sx={pageSubtitle}>
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
            sx={{ px: 2, py: 1.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}
          >
            <Typography variant="body2" fontWeight={700}>Your vendor score</Typography>
            {cards.loading ? <Skeleton width="60%" height={36} /> : (
              <Typography fontWeight={900} letterSpacing={-0.5} lineHeight={1.15} sx={{ fontSize: 28 }}>
                {k?.your_score ?? "–"} <Typography component="span" variant="subtitle1" fontWeight={700}>/ 100</Typography>
              </Typography>
            )}
            <Typography variant="body2" fontWeight={600}>
              Rank {k?.your_rank ?? "–"} of {k?.vendors_ranked ?? "–"} · market average {k?.market_avg_score ?? "–"}
            </Typography>
            <Box sx={{ position: "relative", mt: 0.75 }}>
              <LinearProgress variant="determinate" value={Number(k?.your_score ?? 0)}
                sx={{ height: 8, borderRadius: 4, bgcolor: "#fff", "& .MuiLinearProgress-bar": { bgcolor: C.brown } }} />
              {k?.market_avg_score != null && (
                <Box sx={{ position: "absolute", top: -4, bottom: -4, left: `${k.market_avg_score}%`, borderLeft: `2px dashed ${C.brown}` }} />
              )}
            </Box>
            <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>View leaderboard →</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* pie + hourly chart: this row takes whatever height is left */}
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" } }}>
        <Panel>
          <Typography variant="subtitle1" fontWeight={800}>Orders by vendor</Typography>
          <Typography variant="body2" fontWeight={500}>Share of {count(totalOrders)} restaurant &amp; café transactions</Typography>
          {/* Pie on the left, drawn at the exact size of its box so it is never cut off, list of vendors on the right */}
          <Box sx={{ flex: 1, minHeight: 0, mt: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 2 }}>
            <Box ref={pieBox.ref} sx={{ minHeight: 0, minWidth: 0 }}>
              {vendors.loading ? <Skeleton variant="circular" width={140} height={140} sx={{ m: "8px auto" }} /> : (
                pieBox.width > 0 && pieBox.height > 0 && (
                  <PieChart width={pieBox.width} height={pieBox.height} hideLegend
                            margin={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            series={[{ data: pieData.map((p) => ({ id: p.id, value: p.value, label: p.label, color: p.colour })),
                                       innerRadius: "45%", paddingAngle: 1, cornerRadius: 3 }]} />
                )
              )}
            </Box>
            {/* The top 3, you and the rest: short enough to never need scrolling */}
            <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.75 }}>
              {pieData.map((p) => (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, bgcolor: p.colour }} />
                  <Typography variant="body2" noWrap fontWeight={p.isYou ? 800 : 500}>{p.label}</Typography>
                </Stack>
              ))}
            </Box>
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
          {/* The chart fills all the height the panel has left, so the y axis is as tall as possible */}
          <Box sx={{ flex: 1, minHeight: 160, position: "relative", mt: 1 }}>
            {hours.loading ? <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} /> : (
              <Box sx={{ position: "absolute", inset: 0 }}>
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
              </Box>
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
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 0.75 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>This week on campus</Typography>
              <Typography variant="body2" fontWeight={500}>Today and the next 6 days. Plan staff and stock around these.</Typography>
            </Box>
            <Typography component="a" onClick={() => push("/CalendarPage")} sx={{ cursor: "pointer", fontWeight: 800, color: C.brown }}>
              Full calendar →
            </Typography>
          </Stack>
          {/* The same week view as the calendar page (components/CalendarWeekStrip.tsx) */}
          <CalendarWeekStrip start={today} today={today} onOpenCalendar={() => push("/CalendarPage")} />
        </Panel>
      </Box>
    </Box>
  );
};

export default DashboardPage;