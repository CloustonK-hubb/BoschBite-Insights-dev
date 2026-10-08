import { useState, type ReactNode } from "react";
import { Box, Chip, MenuItem, Select, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { BarChart, Gauge, LineChart, PieChart } from "@mui/x-charts";
import { type Grain, type Period, useAovOverTime, useHours, useMarketStats, useMeals, usePeer, usePromoEffect, useTypes, useVendorStats,useVendors,} from "./api";

// Original colours: blue pills, pink blocks, blue line, yellow bars
const BLUE = "#1565c0";
const YELLOW = "#f9a825";
const PILL_BG = "#e3f2fd";
const PINK = "rgba(212, 83, 126, 0.10)";
const DASH = "-";

const num = (x: number | null | undefined) => Number(x ?? 0);
const rand = (x: number | null | undefined) =>
  `R${num(x).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sign = (x: number | null | undefined) =>
  x == null ? DASH : `${num(x) >= 0 ? "+" : ""}${num(x)}%`;

const fs = (min: number, vw: number, max: number) => `clamp(${min}px, ${vw}vw, ${max}px)`;

const filterSx = { fontSize: fs(11, 0.9, 14) };
const toggleSx = { "& .MuiToggleButton-root": { fontSize: fs(10, 0.8, 12), py: 0.25 } };

// One KPI card in the top row
const Pill = ({ label, value, negative }: { label: string; value: ReactNode; negative?: boolean }) => (
  <Box sx={{ bgcolor: PILL_BG, borderRadius: 3, px: 1.25, py: 0.75, minWidth: 0, overflow: "hidden" }}>
    <Typography noWrap color="text.secondary" sx={{ fontSize: fs(9, 0.75, 12) }}>
      {label}
    </Typography>
    <Typography noWrap sx={{ fontSize: fs(12, 1.2, 20), fontWeight: 500, color: negative ? "error.main" : "text.primary" }}>
      {value}
    </Typography>
  </Box>
);

// Small KPI inside a block
const Stat = ({ label, value, delta }: { label: string; value: ReactNode; delta?: number | null }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography noWrap color="text.secondary" sx={{ fontSize: fs(9, 0.75, 12) }}>
      {label}
    </Typography>
    <Typography noWrap sx={{ fontSize: fs(12, 1.15, 18), fontWeight: 500 }}>
      {value}
      {delta != null && (
        <Box component="span" sx={{ ml: 0.75, fontSize: fs(9, 0.75, 12), color: delta >= 0 ? "success.main" : "error.main" }}>
          {sign(delta)}
        </Box>
      )}
    </Typography>
  </Box>
);

const Block = ({ title, span, children }: { title: string; span: number; children: ReactNode }) => (
  <Box
    sx={{
      gridColumn: `span ${span}`,
      bgcolor: PINK,
      borderRadius: 4,
      p: 1.5,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      minWidth: 0,
      overflow: "hidden",
    }}
  >
    <Typography sx={{ fontWeight: 500, fontSize: fs(13, 1.1, 18), mb: 0.5 }}>{title}</Typography>
    {children}
  </Box>
);

const Fill = ({ children }: { children: ReactNode }) => (
  <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</Box>
);

const row = { display: "flex", gap: 2.5, alignItems: "center", flexWrap: "nowrap", mb: 0.5 } as const;
const blockRow = {
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  minHeight: 0,
} as const;
const chartMargin = { top: 8, bottom: 24, left: 40, right: 8 };

export const DashboardPage = () => {
  const [period, setPeriod] = useState<Period>("week");
  const [grain, setGrain] = useState<Grain>("day");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);

  const vendors = useVendors();
  const types = useTypes();
  const vid = vendorId ?? vendors.data?.[0]?.vendor_id ?? null;

  const market = useMarketStats(period, typeId);
  const stats = useVendorStats(vid, period);
  const promo = usePromoEffect(vid);
  const aov = useAovOverTime(vid, grain);
  const meals = useMeals(vid, period);
  const hours = useHours(vid, period);
  const peer = usePeer(vid, period);

  const error = [vendors, types, market, stats, promo, aov, meals, hours, peer].find((s) => s.error)?.error;
  const m = market.data?.[0];
  const s = stats.data?.[0];
  const p = promo.data?.[0];
  const pr = peer.data?.[0];

  return (
    <Box
      sx={{
        height: "calc(100dvh - 120px)",
        display: "grid",
        gap: 1.5,
        gridTemplateRows: "auto auto minmax(0, 1fr) minmax(0, 1fr)",
        overflow: "hidden",
      }}
    >
      {/* Filters */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "nowrap", minWidth: 0 }}>
        <Select size="small" value={vid ?? ""} onChange={(e) => setVendorId(Number(e.target.value))} sx={{ ...filterSx, minWidth: 160 }}>
          {(vendors.data ?? []).map((v) => (
            <MenuItem key={v.vendor_id} value={v.vendor_id}>
              {v.name}
            </MenuItem>
          ))}
        </Select>
        <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v: Period | null) => v && setPeriod(v)} sx={toggleSx}>
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontWeight: 500, fontSize: fs(12, 1, 16) }}>Market stats</Typography>
        <Select
          size="small"
          displayEmpty
          value={typeId ?? ""}
          onChange={(e) => setTypeId(e.target.value === "" ? null : Number(e.target.value))}
          sx={{ ...filterSx, minWidth: 140 }}
        >
          <MenuItem value="">All vendor types</MenuItem>
          {(types.data ?? []).map((t) => (
            <MenuItem key={t.type_id} value={t.type_id}>
              {t.name}
            </MenuItem>
          ))}
        </Select>
        {error ? (
          <Typography noWrap color="error" sx={{ fontSize: fs(10, 0.8, 12), maxWidth: 260 }}>
            {error}
          </Typography>
        ) : (
          <Typography noWrap color="text.secondary" sx={{ fontSize: fs(9, 0.75, 12) }}>
            {m
              ? `Avg per vendor: ${rand(m.avg_revenue_per_vendor)}, ${num(m.avg_transactions_per_vendor)} orders`
              : market.data
                ? "Not enough vendors of this type"
                : ""}
          </Typography>
        )}
      </Box>

      {/* 8 market stat cards */}
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
        <Pill label="Total vendors" value={m ? m.total_vendors : DASH} />
        <Pill label="Promotions running" value={m ? m.promotions_running : DASH} />
        <Pill label="Transactions" value={m ? m.total_transactions : DASH} />
        <Pill label="Daily revenue" value={m ? rand(m.daily_revenue) : DASH} />
        <Pill label="Peak mealtime" value={m?.peak_mealtime ?? DASH} />
        <Pill label="Revenue growth" value={m ? sign(m.revenue_growth_pct) : DASH} negative={num(m?.revenue_growth_pct) < 0} />
        <Pill label="Discount given" value={m ? rand(m.total_discount_given) : DASH} />
        <Pill label="Orders per student" value={m?.orders_per_student ?? DASH} />
      </Box>

      {/* Row 1: Sales and Promotions */}
      <Box sx={blockRow}>
        <Block title="Sales" span={7}>
          <Box sx={row}>
            <Stat label="Revenue" value={rand(s?.revenue)} delta={s?.revenue_change_pct} />
            <Stat label="Orders" value={num(s?.orders)} delta={s?.orders_change_pct} />
            <Stat label="Avg order value" value={rand(s?.avg_order_value)} delta={s?.avg_order_value_change_pct} />
            <Box sx={{ flex: 1 }} />
            <ToggleButtonGroup size="small" exclusive value={grain} onChange={(_, v: Grain | null) => v && setGrain(v)} sx={toggleSx}>
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1 }}>
            <Box sx={{ minHeight: 0, minWidth: 0 }}>
              <LineChart
                hideLegend
                margin={chartMargin}
                xAxis={[{ scaleType: "point", data: (aov.data ?? []).map((r) => r.period_start) }]}
                series={[{ data: (aov.data ?? []).map((r) => num(r.avg_order_value)), label: "Avg order value (R)", color: BLUE, showMark: false }]}
              />
            </Box>
            <Box sx={{ minHeight: 0, minWidth: 0 }}>
              <PieChart
                series={[
                  {
                    innerRadius: "55%",
                    data: (meals.data ?? []).map((r, i) => ({ id: i, value: num(r.revenue), label: r.meal_period })),
                  },
                ]}
              />
            </Box>
          </Box>
        </Block>

        <Block title="Promotions" span={5}>
          <Stat label="Active promotions" value={num(s?.active_promotions)} />
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography
              sx={{
                fontWeight: 500,
                lineHeight: 1.1,
                fontSize: fs(24, 3, 48),
                color: p && num(p.orders_uplift_pct) < 0 ? "error.main" : "primary.main",
              }}
            >
              {p ? sign(p.orders_uplift_pct) : DASH}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: fs(9, 0.75, 12) }}>
              orders per day on promo days vs other days (last 90 days)
            </Typography>
          </Box>
          <Box sx={{ ...row, mb: 0 }}>
            <Stat label="Revenue uplift" value={p ? sign(p.revenue_uplift_pct) : DASH} />
            <Stat label="Discount cost" value={rand(p?.discount_cost)} />
            <Stat label="Revenue per R1 discount" value={rand(p?.revenue_per_rand_discount)} />
          </Box>
        </Block>
      </Box>

      {/* Row 2: Orders and demand, Peer benchmark */}
      <Box sx={blockRow}>
        <Block title="Orders and Demand" span={8}>
          <Box sx={row}>
            <Stat label="Today's orders" value={num(s?.todays_orders)} />
            <Stat label="Avg order today" value={rand(s?.todays_avg_order_value)} />
          </Box>
          <Fill>
            <BarChart
              hideLegend
              margin={chartMargin}
              xAxis={[{ scaleType: "band", data: (hours.data ?? []).map((r) => `${r.hour_of_day}:00`) }]}
              series={[{ data: (hours.data ?? []).map((r) => num(r.orders)), label: "Orders", color: YELLOW }]}
            />
          </Fill>
        </Block>

        <Block title="Peer benchmark" span={4}>
          {pr ? (
            <>
              <Fill>
                <Gauge value={num(pr.percentile)} valueMax={100} text={({ value }) => `${value}th`} />
              </Fill>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                <Chip
                  size="small"
                  label={pr.verdict}
                  color={pr.verdict === "Above average" ? "success" : pr.verdict === "Below average" ? "error" : "default"}
                />
                <Typography color="text.secondary" sx={{ fontSize: fs(9, 0.75, 12) }}>
                  vs {num(pr.peer_count)} similar vendors
                </Typography>
              </Box>
            </>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: fs(11, 0.85, 13) }}>
              Not enough similar vendors for this period yet. Try the month view.
            </Typography>
          )}
        </Block>
      </Box>
    </Box>
  );
};

export default DashboardPage;