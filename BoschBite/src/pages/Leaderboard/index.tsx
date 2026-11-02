import { ScoreBreakdownFooter } from "./scoreBreakdownFooter";
import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { useRpc } from "../../hooks/useRpc";
import { insightsColours, scorePartColours, insightsLayout, pageTitle, pageSubtitle } from "../../providers/theme";


/*
   SETTINGS
   Colours and margins come from providers/theme.ts, shared with the dashboard.
   Change them there, not here.
 */

//Extra white space left and right of the content
const SIDE_MARGIN = insightsLayout.sideMargin;

//BoschBite colours
const C = insightsColours;

//One colour per part of the score
const PART_COLOURS = scorePartColours;


/*
   TYPES
   Shapes of the rows returned by the SQL functions kpi_leaderboard and kpi_my_score_compare
 */

//Other restaurants come back anonymous as "Restaurant #n" with only their rank and points
type LeaderboardRow = {
  rank: number;
  vendor_name: string;
  is_you: boolean;
  total_score: number;
  reach_points: number;
  loyalty_points: number;
  efficiency_points: number;
  location_points: number;
  period_name: string;
  period_type: string;
  period_start: string;
  period_end: string;
  days_counted: number;
};

//Periods for the period dropdown, newest first
type PeriodOption = {
  period_id: string;
  name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

//One row for this period and one for the same period last year
type ScoreRow = {
  which: "this_period" | "last_year";
  period_name: string;
  period_type: string;
  period_start: string;
  period_end: string;
  days_counted: number;
  is_ranked: boolean;
  vendors_ranked: number;
  rank: number | null;
  total_score: number | null;
  reach_points: number | null;
  loyalty_points: number | null;
  efficiency_points: number | null;
  location_points: number | null;
  customers_reached: number | null;
  returning_customers: number | null;
  loyalty_pct: number | null;
  promo_days: number | null;
  revenue_per_day: number | null;
  benchmark_revenue_per_day: number | null;
  efficiency_ratio: number | null;
  //Share of the 25 efficiency points from the interval the efficiency score falls in
  efficiency_rating: number | null;
  avg_discount_pct: number | null;
  benchmark_discount_pct: number | null;
  //"bigger", "same" or "smaller" discount than the benchmark
  discount_vs_benchmark: "bigger" | "same" | "smaller" | null;
  efficiency_result: string | null;
  nearby_other_types: number | null;
  nearby_restaurants: number | null;
};


/*
   HELPERS
 */

const rand = (n: number | null | undefined) =>
  n == null ? "–" : new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(Number(n));

const points = (n: number | null | undefined) => (n == null ? "–" : Number(n).toFixed(1));

//Efficiency points keep up to 2 decimals (2.5, 6.25, 13.75, 21.25)
const effPoints = (n: number | null | undefined) =>
  n == null ? "–" : String(Number(Number(n).toFixed(2)));

//Exact efficiency score, up to 4 decimals (2.2861, 0.998, 1.05)
const exact = (n: number) => String(Number(n.toFixed(4)));

//Efficiency score as in the footer table, for example "Efficiency score 2.2861 (above 1)"
const effScore = (ratio: number | null | undefined) =>
  ratio == null
    ? "No benchmark available"
    : `Efficiency score ${exact(Number(ratio))} (${Number(ratio) >= 1 ? "above" : "below"} 1)`;

//Number of days in a period, both dates included
const periodLength = (start: string, end: string) =>
  Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 864e5) + 1;

const year = (iso: string) => iso.slice(0, 4);

//Date range of a period, for example "14 Sep – 23 Oct 2026"
const dateRange = (start: string, end: string) => {
  const f = (iso: string, withYear: boolean) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC",
    });
  return `${f(start, false)} – ${f(end, true)}`;
};

//Same colours as the efficiency table in the score breakdown footer
const outcomeType = (result: string | null): "good" | "bad" | "neutral" =>
  result === "Paid off" || result === "Held up" ? "good"
  : result === "Lost money" || result === "Bigger discount worth keeping" ? "bad"
  : "neutral";


//Says how the discount changed against the benchmark, for example
//"Your average discount decreased from 19.1% (benchmark) to 18.2%."
const discountText = (r: ScoreRow) =>
  r.discount_vs_benchmark === "smaller"
    ? `Your average discount decreased from ${r.benchmark_discount_pct}% (benchmark) to ${r.avg_discount_pct}%.`
    : r.discount_vs_benchmark === "bigger"
      ? `Your average discount increased from ${r.benchmark_discount_pct}% (benchmark) to ${r.avg_discount_pct}%.`
      : `Your average discount stayed the same as the benchmark at ${r.avg_discount_pct}%.`;


/*
   BUILDING BLOCKS
   Small reusable pieces of the page: panels, the change badge, the score bar and the score parts
 */

//Rounded card with a bold heading, same as the dashboard panels
const Panel = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: C.border }}>
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      {subtitle && <Typography variant="body2" fontWeight={500} sx={{ mb: 1.5 }}>{subtitle}</Typography>}
      {children}
    </CardContent>
  </Card>
);

//Shows how much a score went up or down since last year, green when up, red when down and grey when the same
const Change = ({ now, before, digits = 1 }: {
  now: number | null | undefined; before: number | null | undefined; digits?: number;
}) => {
  if (now == null || before == null) return null;
  const diff = Number((Number(now) - Number(before)).toFixed(digits));
  const size = digits === 1 ? Math.abs(diff).toFixed(1) : String(Number(Math.abs(diff).toFixed(digits)));
  return (
    <Box
      component="span"
      sx={{ ml: 0.75, fontWeight: 800, color: diff > 0 ? C.up : diff < 0 ? C.down : C.taupe }}
    >
      {diff === 0 ? "no change" : `${diff > 0 ? "▲" : "▼"} ${size}`}
    </Box>
  );
};

//The four parts as coloured pieces of one bar out of 100, so you can see what the total is made of
const ScoreBar = ({ parts, height = 10 }: { parts: { key: keyof typeof PART_COLOURS; value: number | null }[]; height?: number }) => (
  <Box sx={{ display: "flex", height, borderRadius: height, overflow: "hidden", bgcolor: alpha(C.brown, 0.08) }}>
    {parts.map((p) => (
      <Box key={p.key} sx={{ width: `${Math.max(0, Number(p.value ?? 0))}%`, bgcolor: PART_COLOURS[p.key] }} />
    ))}
  </Box>
);

//Small coloured dot with a label, used under the score bars
const Dot = ({ colour, children }: { colour: string; children: ReactNode }) => (
  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mr: 1.5, whiteSpace: "nowrap" }}>
    <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colour }} />
    {children}
  </Box>
);

//Verdict from the efficiency table, green when good, red when bad and cream otherwise
const Verdict = ({ result }: { result: string }) => {
  const type = outcomeType(result);
  return (
    <Chip
      size="small"
      label={result}
      sx={{
        fontWeight: 700,
        bgcolor: type === "good" ? alpha(C.up, 0.12) : type === "bad" ? alpha(C.down, 0.12) : C.cream,
        color: type === "good" ? C.up : type === "bad" ? C.down : C.brown,
      }}
    />
  );
};

//One part of the score: coloured icon, what it means in plain words, the points and last year
const ScorePart = ({ part, icon, title, headline, pointsText, value, lastYear, children }: {
  part: keyof typeof PART_COLOURS; icon: ReactNode; title: string; headline: string;
  pointsText: string; value: number | null; lastYear?: ReactNode; children?: ReactNode;
}) => (
  <Box sx={{ display: "flex", gap: 1.5, py: 1.75, borderTop: `1px solid ${C.border}` }}>
    <Box sx={{
      width: 40, height: 40, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      bgcolor: alpha(PART_COLOURS[part], 0.15), color: PART_COLOURS[part],
    }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>{title}</Typography>
        <Typography variant="h6" fontWeight={900} lineHeight={1}>
          {pointsText}
          <Typography component="span" variant="caption" fontWeight={700}> / 25</Typography>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Number(value ?? 0) * 4)}
        sx={{ my: 0.75, height: 6, borderRadius: 3, bgcolor: alpha(C.brown, 0.08), "& .MuiLinearProgress-bar": { bgcolor: PART_COLOURS[part], borderRadius: 3 } }}
      />
      <Typography variant="body2" fontWeight={700}>{headline}</Typography>
      {children && <Typography variant="body2" fontWeight={500} component="div" sx={{ mt: 0.25 }}>{children}</Typography>}
      {lastYear && (
        <Typography variant="caption" fontWeight={600} component="div" sx={{ mt: 0.5, color: C.taupe }}>
          {lastYear}
        </Typography>
      )}
    </Box>
  </Box>
);

//One row of the top 10: rank, name, score, a bar of the four parts and their points as subtext
const LeaderRow = ({ r }: { r: LeaderboardRow }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 1.5, p: 1.25, mb: 1, borderRadius: 3,
    //Thin grey outline for every row, your own row keeps the yellow fill
    border: "1px solid rgba(0,0,0,0.12)",
    bgcolor: r.is_you ? C.yellow : "#fff",
  }}>
    <Box sx={{
      width: 36, height: 36, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: 15,
      bgcolor: r.rank <= 3 ? C.brown : C.cream,
      color: r.rank <= 3 ? C.cream : C.brown,
    }}>
      {r.rank}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1" fontWeight={800} noWrap>{r.vendor_name}</Typography>
        {r.is_you && <Chip label="You" size="small" sx={{ height: 20, bgcolor: C.brown, color: C.cream, fontWeight: 800 }} />}
      </Box>
      <Box sx={{ my: 0.5 }}>
        <ScoreBar height={6} parts={[
          { key: "reach", value: r.reach_points },
          { key: "loyalty", value: r.loyalty_points },
          { key: "efficiency", value: r.efficiency_points },
          { key: "location", value: r.location_points },
        ]} />
      </Box>
      <Typography variant="caption" fontWeight={600} component="div">
        <Dot colour={PART_COLOURS.reach}>Reach {points(r.reach_points)}</Dot>
        <Dot colour={PART_COLOURS.loyalty}>Loyalty {points(r.loyalty_points)}</Dot>
        <Dot colour={PART_COLOURS.efficiency}>Efficiency {effPoints(r.efficiency_points)}</Dot>
        <Dot colour={PART_COLOURS.location}>Location {points(r.location_points)}</Dot>
      </Typography>
    </Box>
    <Typography variant="h5" fontWeight={900} letterSpacing={-0.5} sx={{ flexShrink: 0 }}>
      {points(r.total_score)}
      <Typography component="span" variant="caption" fontWeight={700}> / 100</Typography>
    </Typography>
  </Box>
);


/*
   LEADERBOARD PAGE
 */

//Leaderboard page: the top 10 restaurants on the left and the logged-in vendor's score on the right
export const LeaderboardPage = () => {

  //Chosen period, empty means the current period
  const [periodId, setPeriodId] = useState<string>("");
  const periods = useRpc<PeriodOption>("kpi_leaderboard_periods", {});
  const currentId = periods.data?.find((p) => p.is_current)?.period_id ?? "";
  const args = periodId ? { p_period_id: periodId } : {};

  //Leaderboard for the chosen period and the vendor's score against the same period last year
  const board = useRpc<LeaderboardRow>("kpi_leaderboard", args);
  const scores = useRpc<ScoreRow>("kpi_my_score_compare", args);

  //Hide the old period's rows while a newly chosen period loads
  const rows = board.loading ? [] : board.data ?? [];
  const top10 = rows.slice(0, 10);
  //The vendor's own row, shown under the top 10 when it is not already in it
  const mine = rows.find((r) => r.is_you);
  const mineOutsideTop10 = mine && !top10.some((r) => r.is_you) ? mine : null;
  const period = rows[0];
  //Average score of all ranked restaurants, shown as a dashed line on your score bar
  const marketAvg = rows.length ? rows.reduce((a, r) => a + Number(r.total_score), 0) / rows.length : null;

  const now = scores.loading ? undefined : scores.data?.find((s) => s.which === "this_period");
  const lastYear = scores.loading ? undefined : scores.data?.find((s) => s.which === "last_year");
  //Past periods are complete, the current one is still running
  const isCurrent = !periodId || periodId === currentId;
  const notYet = isCurrent ? "you had no sales yet" : "you had no sales in this period";
  const ly = lastYear?.is_ranked ? lastYear : null;

  //Admin accounts have no restaurant of their own, so the right side shows a note instead
  const noRestaurant = scores.error?.includes("Choose a restaurant") || scores.error?.includes("not linked");

  //Strongest part and the part with the most room to grow, to show at a glance
  const parts = now?.is_ranked
    ? [
        { key: "reach" as const, label: "Reach", value: Number(now.reach_points ?? 0) },
        { key: "loyalty" as const, label: "Loyalty", value: Number(now.loyalty_points ?? 0) },
        { key: "efficiency" as const, label: "Efficiency", value: Number(now.efficiency_points ?? 0) },
        { key: "location" as const, label: "Location", value: Number(now.location_points ?? 0) },
      ]
    : [];
  const strongest = parts.length ? parts.reduce((b, p) => (p.value > b.value ? p : b)) : null;
  const weakest = parts.length ? parts.reduce((b, p) => (p.value < b.value ? p : b)) : null;


  //Function to scroll to the score breakdown footer when the info icon is clicked
  const scrollToBreakdown = () => {
    document
      .getElementById("score-breakdown")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  return (
    <Box sx={{ px: SIDE_MARGIN, pb: 3, color: C.brown }}>
      {/* Editing the Leaderboard heading to include an info icon that when clicked will scroll down to the score breakdown footer automatically */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end", justifyContent: "space-between" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={pageTitle}>
              Leaderboard
            </Typography>
            <Tooltip
              title="Overall score out of 100: reach 25%, loyalty 25%, efficiency 25% and location 25%. Click to see the full breakdown below."
              arrow
            >
              <IconButton size="small" onClick={scrollToBreakdown} aria-label="How the leaderboard is scored" sx={{ color: C.brown }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography sx={pageSubtitle}>
            {period
              ? isCurrent
                ? `${period.period_name} · ${period.period_type} · day ${period.days_counted} of ${periodLength(period.period_start, period.period_end)} · other restaurants stay anonymous`
                : `${period.period_name} ${year(period.period_start)} · ${period.period_type} · ${dateRange(period.period_start, period.period_end)} · other restaurants stay anonymous`
              : "Restaurants on BoschCard"}
          </Typography>
        </Box>

        {/* Period dropdown to look at previous periods, newest first */}
        <TextField
          select
          size="small"
          label="Period"
          value={periodId || currentId}
          onChange={(e) => setPeriodId(e.target.value === currentId ? "" : e.target.value)}
          sx={{ minWidth: 280, bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 400, borderRadius: 3 } } } }}
        >
          {(periods.data ?? []).map((p) => (
            <MenuItem key={p.period_id} value={p.period_id}>
              <Box>
                <Typography variant="body2" fontWeight={p.is_current ? 800 : 600}>
                  {p.name} {year(p.start_date)}{p.is_current ? " (current)" : ""}
                </Typography>
                <Typography variant="caption" sx={{ color: C.taupe }}>
                  {p.period_type} · {dateRange(p.start_date, p.end_date)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Leaderboard: top 10 on the left, your score on the right */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, alignItems: "start" }}>

        {/* Top 10 restaurants for the current period */}
        <Panel title="Top 10 restaurants" subtitle="Score out of 100, with the points for each part underneath">
          {board.error && <Alert severity="error" sx={{ borderRadius: 3 }}>Could not load the leaderboard: {board.error}</Alert>}
          {board.loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={76} sx={{ mb: 1, borderRadius: 3 }} />)}
          {!board.loading && !board.error && rows.length === 0 && (
            <Typography variant="body2" fontWeight={500}>No restaurant has sales in this period{isCurrent ? " yet" : ""}.</Typography>
          )}
          {top10.map((r) => <LeaderRow key={`${r.rank}-${r.vendor_name}`} r={r} />)}

          {/* Your own row underneath when you are not in the top 10 */}
          {mineOutsideTop10 && (
            <>
              <Typography variant="body2" fontWeight={800} sx={{ textAlign: "center", my: 0.5 }}>⋯</Typography>
              <LeaderRow r={mineOutsideTop10} />
            </>
          )}
          {!board.loading && rows.length > 0 && !mine && !noRestaurant && (
            <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>
              You are not ranked in this period because {notYet}.
            </Typography>
          )}
        </Panel>

        {/* The logged-in vendor's score, rank and breakdown against last year */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {noRestaurant && <Alert severity="info" sx={{ borderRadius: 3 }}>Vendor scores show here when you log in with a vendor account.</Alert>}
          {scores.error && !noRestaurant && <Alert severity="error" sx={{ borderRadius: 3 }}>Could not load your score: {scores.error}</Alert>}
          {scores.loading && <><Skeleton variant="rounded" height={170} sx={{ borderRadius: 4 }} /><Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} /></>}

          {now && !now.is_ranked && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              You are not ranked in {now.period_name} {year(now.period_start)} because {notYet}.
            </Alert>
          )}

          {now && now.is_ranked && (
            <>
              {/* Yellow score card, same as "Your vendor score" on the dashboard */}
              <Card sx={{ borderRadius: 4, bgcolor: C.yellow, boxShadow: "none" }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="subtitle2" fontWeight={700}>Your vendor score</Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="h3" fontWeight={900} letterSpacing={-1} lineHeight={1.1}>{points(now.total_score)}</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>/ 100</Typography>
                    <Chip label={`Rank ${now.rank} of ${now.vendors_ranked}`} size="small"
                          sx={{ ml: "auto", bgcolor: C.brown, color: C.cream, fontWeight: 800 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    Market average {marketAvg == null ? "–" : marketAvg.toFixed(1)} · {now.period_name} {year(now.period_start)}
                  </Typography>
                  <Box sx={{ position: "relative", mt: 1.25 }}>
                    <LinearProgress variant="determinate" value={Number(now.total_score ?? 0)}
                      sx={{ height: 8, borderRadius: 4, bgcolor: "#fff", "& .MuiLinearProgress-bar": { bgcolor: C.brown } }} />
                    {marketAvg != null && (
                      <Box sx={{ position: "absolute", top: -4, bottom: -4, left: `${marketAvg}%`, borderLeft: `2px dashed ${C.brown}` }} />
                    )}
                  </Box>
                  <Chip
                    size="small"
                    sx={{ mt: 1.5, bgcolor: C.cream, fontWeight: 700, height: "auto", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }}
                    label={
                      lastYear
                        ? ly
                          ? <>{isCurrent ? "Same days last year" : "Same period last year"}: {points(ly.total_score)} · rank {ly.rank} of {ly.vendors_ranked}<Change now={now.total_score} before={ly.total_score} /></>
                          : `Not ranked in ${lastYear.period_name} ${year(lastYear.period_start)}`
                        : "No matching period last year"
                    }
                  />
                </CardContent>
              </Card>

              {/* Breakdown: what the score is made of, then each part in plain words */}
              <Panel title="Your score breakdown" subtitle="Each part is worth up to 25 points">
                <ScoreBar height={14} parts={parts.map((p) => ({ key: p.key, value: p.value }))} />
                <Typography variant="caption" fontWeight={600} component="div" sx={{ mt: 0.75 }}>
                  {parts.map((p) => (
                    <Dot key={p.key} colour={PART_COLOURS[p.key]}>
                      {p.label} {p.key === "efficiency" ? effPoints(p.value) : points(p.value)}
                    </Dot>
                  ))}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.25, mb: 0.5 }}>
                  {strongest && <Chip size="small" label={`Strongest: ${strongest.label}`} sx={{ bgcolor: alpha(C.up, 0.12), color: C.up, fontWeight: 700 }} />}
                  {weakest && weakest.key !== strongest?.key && (
                    <Chip size="small" label={`Most room to grow: ${weakest.label}`} sx={{ bgcolor: C.cream, fontWeight: 700 }} />
                  )}
                </Box>

                <ScorePart part="reach" icon={<CampaignOutlinedIcon fontSize="small" />} title="Reach"
                           value={now.reach_points} pointsText={points(now.reach_points)}
                           headline={`${now.customers_reached} students bought from you`}
                           lastYear={ly && <>Last year: {ly.customers_reached} students · {points(ly.reach_points)} pts<Change now={now.reach_points} before={ly.reach_points} /></>}>
                  Over {now.promo_days} day{now.promo_days === 1 ? "" : "s"} of discounted sales this period
                </ScorePart>

                <ScorePart part="loyalty" icon={<RepeatOutlinedIcon fontSize="small" />} title="Loyalty"
                           value={now.loyalty_points} pointsText={points(now.loyalty_points)}
                           headline={`${now.loyalty_pct ?? 0}% came back for more`}
                           lastYear={ly && <>Last year: {ly.loyalty_pct ?? 0}% · {points(ly.loyalty_points)} pts<Change now={now.loyalty_points} before={ly.loyalty_points} /></>}>
                  {now.returning_customers} of your {now.customers_reached} students bought 2 or more times
                </ScorePart>

                <ScorePart part="efficiency" icon={<BalanceOutlinedIcon fontSize="small" />} title="Efficiency"
                           value={now.efficiency_points} pointsText={effPoints(now.efficiency_points)}
                           headline={effScore(now.efficiency_ratio)}
                           lastYear={ly && <>Last year: {effScore(ly.efficiency_ratio)} · {effPoints(ly.efficiency_points)} pts<Change now={now.efficiency_ratio} before={ly.efficiency_ratio} digits={4} /></>}>
                  {now.efficiency_ratio == null ? (
                    "You had no sales in this period in earlier years, so efficiency scores 0"
                  ) : (
                    <>
                      <Box>{rand(now.revenue_per_day)} a day against your benchmark of {rand(now.benchmark_revenue_per_day)}</Box>
                      <Box>{discountText(now)}</Box>
                    </>
                  )}
                  {now.efficiency_result && (
                    <Box sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Verdict result={now.efficiency_result} />
                      {ly?.efficiency_result && (
                        <Typography variant="caption" fontWeight={600} sx={{ color: C.taupe }}>last year: {ly.efficiency_result}</Typography>
                      )}
                    </Box>
                  )}
                </ScorePart>

                <ScorePart part="location" icon={<PlaceOutlinedIcon fontSize="small" />} title="Location"
                           value={now.location_points} pointsText={points(now.location_points)}
                           headline={`${now.nearby_other_types} other vendors and ${now.nearby_restaurants} restaurants nearby`}
                           lastYear={ly && <>Last year: {points(ly.location_points)} pts<Change now={now.location_points} before={ly.location_points} /></>}>
                  Within 300 m. Other vendor types bring new customers, other restaurants compete with you
                </ScorePart>
              </Panel>
            </>
          )}
        </Box>
      </Box>

      {/* Score breakdown footer. Must remain at the bottom of the leaderboard. DO NOT REMOVE */}
      <ScoreBreakdownFooter />
    </Box>
  );
};