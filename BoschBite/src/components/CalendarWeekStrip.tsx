import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Box, Button, Paper, Skeleton, Typography } from "@mui/material";
import { supabaseClient } from "../providers/supabaseClient";
import { insightsColours } from "../providers/theme";
import { promotionRunsOnDay, selectDailyPromotions } from "../pages/calendar/promotions";


/*
   CALENDAR WEEK STRIP
   One week of the calendar page, for the dashboard: the same cells, colours and event bars as
   pages/calendar, reading the same tables (calendar_event and the vendor's own promo_window_v2 rows).
   Each event is one bar across the days it runs, kept in the same row for the whole week.
 */

const C = insightsColours;

type CalendarRow = Record<string, unknown>;

type Identity = {
  role?: string | null;
  vendor_id?: string | null;
};

type CalendarEvent = {
  row: CalendarRow;
  rowIndex: number;
  isPromotion: boolean;
  color: (typeof PERIOD_COLORS)[number];
};


/* CALENDAR STYLE */

//Same colours and colour choice as pages/calendar/index.tsx, so an event has the same colour on both pages
const PERIOD_COLORS = [
  { background: "#e3f2fd", border: "#1976d2", text: "#0d47a1" },
  { background: "#fce4ec", border: "#c2185b", text: "#880e4f" },
  { background: "#e8f5e9", border: "#388e3c", text: "#1b5e20" },
  { background: "#fff3e0", border: "#ef6c00", text: "#e65100" },
  { background: "#ede7f6", border: "#673ab7", text: "#311b92" },
  { background: "#e0f2f1", border: "#00897b", text: "#004d40" },
  { background: "#fffde7", border: "#f9a825", text: "#795548" },
  { background: "#f3e5f5", border: "#8e24aa", text: "#4a148c" },
] as const;

const colorForPeriod = (periodType: unknown) => {
  const label = String(periodType ?? "Other");
  const hash = [...label].reduce((value, character) => value + character.charCodeAt(0), 0);
  return PERIOD_COLORS[hash % PERIOD_COLORS.length];
};

//Reads a date the same way as the calendar page (a plain YYYY-MM-DD is a local date)
const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  let date: Date;
  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatValue = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatDiscount = (value: unknown) => {
  const discount = Number(value);
  if (!Number.isFinite(discount)) return "Promotion";
  const percentage = discount > 0 && discount <= 1 ? discount * 100 : discount;
  return `${percentage.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
};

//Label on the bar: the promotion's name (or its discount), or the event's period type
const eventLabel = (event: CalendarEvent) => event.isPromotion
  ? String(event.row.promo_name ?? "").trim() ||
    (event.row.discount != null && event.row.discount !== "" ? formatDiscount(event.row.discount) : "Promotion")
  : formatValue(event.row.period_type ?? event.row.event_type ?? "Other");

//Second part of the bar: "Promotion", or the event's function, name, title or description (same order as the calendar page)
const eventSummary = (event: CalendarEvent) => event.isPromotion
  ? "Promotion"
  : formatValue(event.row.function ?? event.row.name ?? event.row.title ?? event.row.description ?? "");

//Start of today on this computer, the same as the calendar page uses to hide promotions that haven't started
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dayKey = (day: Date) => `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

const isoOf = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;


/* WEEK STRIP */

//The 7 days from start (a YYYY-MM-DD date). Clicking a day or an event opens the calendar page.
export const CalendarWeekStrip = ({ start, today, onOpenCalendar }: { start: string; today: string; onOpenCalendar: () => void }) => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<Identity>();
  const isVendor = identity?.role === "vendor_admin" || identity?.role === "vendor_manager";
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [promoRows, setPromoRows] = useState<CalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  //The 7 days shown, plus the day before and after so bars can join up across the edges
  const days = useMemo(() => {
    const first = parseDate(start)!;
    return Array.from({ length: 7 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [start]);
  const rangeFrom = isoOf(new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate() - 1));
  const rangeTo = isoOf(new Date(days[6].getFullYear(), days[6].getMonth(), days[6].getDate() + 1));

  //Load the calendar events and promotions for this week, the same way as the calendar page
  useEffect(() => {
    if (identityLoading || !identity) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      const promotionsQuery = supabaseClient.from("promo_window_v2").select("*")
        .lte("start_date", rangeTo).gte("end_date", rangeFrom);
      const [{ data, error }, promotions] = await Promise.all([
        supabaseClient.from("calendar_event").select("*"),
        isVendor
          ? identity.vendor_id == null
            ? Promise.resolve({ data: [], error: null })
            : promotionsQuery.eq("vendor_id", identity.vendor_id)
          : promotionsQuery,
      ]);
      if (!active) return;
      if (error) setLoadError(`Unable to load the calendar: ${error.message}`);
      setRows(error ? [] : ((data ?? []) as CalendarRow[]));
      //Like the calendar page: promotions that haven't started yet are not shown
      const promoData = ((promotions.data ?? []) as CalendarRow[]).filter((row) => {
        const promoStart = parseDate(row.start_date);
        return promoStart != null && promoStart <= startOfToday();
      });
      if (promoData.length > 0) {
        //Vendor type for each promotion, so the same promotions are picked per day as on the calendar page
        const { data: vendors } = await supabaseClient.from("vendor").select("id,type_id")
          .in("id", [...new Set(promoData.map((row) => String(row.vendor_id)))]);
        if (!active) return;
        const vendorTypes = new Map(((vendors ?? []) as { id: unknown; type_id: unknown }[]).map((vendor) => [String(vendor.id), vendor.type_id]));
        setPromoRows(promoData.map((row) => ({ ...row, type_id: vendorTypes.get(String(row.vendor_id)) ?? row.type_id })));
      } else {
        setPromoRows([]);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [identityLoading, identity?.role, identity?.vendor_id, rangeFrom, rangeTo]);

  //Events on each day from the day before to the day after the week, same rules as the calendar page
  const eventsByDay = useMemo(() => {
    const events = new Map<string, CalendarEvent[]>();
    const firstDay = parseDate(rangeFrom)!;
    const lastDay = parseDate(rangeTo)!;
    [...rows, ...promoRows].forEach((row, rowIndex) => {
      const isPromotion = rowIndex >= rows.length;
      const startDate = parseDate(row.start_date);
      const end = parseDate(row.end_date) ?? startDate;
      if (!startDate || !end || end < firstDay || startDate > lastDay) return;
      const event: CalendarEvent = {
        row, rowIndex, isPromotion,
        color: colorForPeriod(isPromotion ? "Promotion" : row.period_type ?? row.event_type),
      };
      const day = new Date(Math.max(startDate.getTime(), firstDay.getTime()));
      const lastVisibleDay = new Date(Math.min(end.getTime(), lastDay.getTime()));
      while (day <= lastVisibleDay) {
        if (!isPromotion || promotionRunsOnDay(row, day)) {
          events.set(dayKey(day), [...(events.get(dayKey(day)) ?? []), event]);
        }
        day.setDate(day.getDate() + 1);
      }
    });
    for (const [key, dayEvents] of events) events.set(key, selectDailyPromotions(dayEvents));
    return events;
  }, [rows, promoRows, rangeFrom, rangeTo]);

  //Each event becomes one or more bars across the week: a bar for every run of days in a row it is on
  //(a weekly promotion gives a separate one-day bar per promotion day)
  const segments = useMemo(() => {
    const seen = new Map<number, CalendarEvent>();
    days.forEach((day) => (eventsByDay.get(dayKey(day)) ?? []).forEach((e) => seen.set(e.rowIndex, e)));
    const onDay = (event: CalendarEvent, day: Date) => (eventsByDay.get(dayKey(day)) ?? []).some((e) => e.rowIndex === event.rowIndex);
    const list: { event: CalendarEvent; from: number; to: number; left: boolean; right: boolean }[] = [];
    for (const event of seen.values()) {
      let from = -1;
      for (let col = 0; col <= 7; col++) {
        const on = col < 7 && onDay(event, days[col]);
        if (on && from < 0) from = col;
        if (!on && from >= 0) {
          const to = col - 1;
          const before = new Date(days[from].getFullYear(), days[from].getMonth(), days[from].getDate() - 1);
          const after = new Date(days[to].getFullYear(), days[to].getMonth(), days[to].getDate() + 1);
          list.push({ event, from, to, left: onDay(event, before), right: onDay(event, after) });
          from = -1;
        }
      }
    }
    //Longest and earliest bars get the top rows; calendar events above promotions
    return list.sort((a, b) => a.from - b.from || (b.to - b.from) - (a.to - a.from)
      || Number(a.event.isPromotion) - Number(b.event.isPromotion) || a.event.rowIndex - b.event.rowIndex);
  }, [days, eventsByDay]);

  //Give every bar a row so a bar stays in the same row for all its days (no zig-zag between days)
  const MAX_ROWS = 3;
  const placed: { segment: (typeof segments)[number]; row: number }[] = [];
  const hidden = Array(7).fill(0) as number[];
  const taken: boolean[][] = [];
  for (const segment of segments) {
    let row = 0;
    while (taken[row] && taken[row].slice(segment.from, segment.to + 1).some(Boolean)) row++;
    if (row >= MAX_ROWS) {
      for (let col = segment.from; col <= segment.to; col++) hidden[col]++;
      continue;
    }
    taken[row] = taken[row] ?? Array(7).fill(false);
    for (let col = segment.from; col <= segment.to; col++) taken[row][col] = true;
    placed.push({ segment, row });
  }
  const barRows = Math.max(1, Math.min(MAX_ROWS, taken.length));
  const todayDate = parseDate(today);
  const BAR = 20;

  if (loadError) return <Typography variant="body2" color="error">{loadError}</Typography>;
  if (loading) return <Skeleton variant="rectangular" height={18 + 24 + barRows * (BAR + 3) + 6} sx={{ borderRadius: 2 }} />;

  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      //weekday names, day numbers, one row per bar, a little space at the bottom
      gridTemplateRows: `18px 24px repeat(${barRows}, ${BAR}px) 6px`,
      rowGap: "3px",
    }}>
      {/* Weekday names, the same style as the calendar page's header row */}
      {days.map((day, col) => (
        <Typography key={`h${dayKey(day)}`} align="center"
          sx={{ gridColumn: col + 1, gridRow: 1, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "text.secondary", lineHeight: "18px" }}>
          {day.toLocaleDateString("en-ZA", { weekday: "short" })}
        </Typography>
      ))}

      {/* Day cells behind the bars, with the calendar page's thin grid lines */}
      {days.map((day, col) => (
        <Paper key={`c${dayKey(day)}`} variant="outlined" role="button" tabIndex={0}
          aria-label={`Open the calendar at ${day.toLocaleDateString()}`}
          onClick={onOpenCalendar}
          onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenCalendar(); } }}
          sx={{
            gridColumn: col + 1, gridRow: "2 / -1", minWidth: 0, border: 0, borderRadius: 0, cursor: "pointer",
            boxShadow: "inset 0 0 0 1px rgba(128,128,128,0.25)",
            bgcolor: "background.paper",
            marginBottom: "-3px",
          }} />
      ))}

      {/* Day numbers (today bold and underlined, like the calendar page) and how many bars didn't fit */}
      {days.map((day, col) => {
        const isToday = todayDate != null && dayKey(day) === dayKey(todayDate);
        return (
          <Box key={`n${dayKey(day)}`} sx={{ gridColumn: col + 1, gridRow: 2, px: 0.75, display: "flex", alignItems: "center", gap: 0.5, pointerEvents: "none", zIndex: 1 }}>
            <Typography variant="caption" sx={{
              fontWeight: isToday ? 800 : 400,
              color: isToday ? C.brown : undefined,
              textDecoration: isToday ? "underline" : undefined,
              textUnderlineOffset: 3,
            }}>
              {day.getDate()}
            </Typography>
            {isToday && <Typography variant="caption" sx={{ fontWeight: 800, color: C.brown, letterSpacing: 0.5 }}>TODAY</Typography>}
            {hidden[col] > 0 && <Typography variant="caption" sx={{ ml: "auto", color: "text.secondary" }}>+{hidden[col]} more</Typography>}
          </Box>
        );
      })}

      {/* One bar per event, across all the days it runs this week, coloured like the calendar page */}
      {placed.map(({ segment, row }) => {
        const { event, from, to, left, right } = segment;
        const label = eventLabel(event);
        const summary = eventSummary(event);
        return (
          <Button key={`${event.rowIndex}-${from}`} title={`${label}: ${summary}`}
            onClick={onOpenCalendar}
            sx={{
              gridColumn: `${from + 1} / ${to + 2}`, gridRow: row + 3, zIndex: 1,
              ml: left ? 0 : "6px", mr: right ? 0 : "6px",
              minWidth: 0, height: BAR, minHeight: BAR, px: 0.75, py: 0,
              justifyContent: "flex-start",
              borderRadius: `${left ? 0 : 4}px ${right ? 0 : 4}px ${right ? 0 : 4}px ${left ? 0 : 4}px`,
              borderLeft: left ? 0 : 3,
              borderColor: event.color.border,
              bgcolor: event.color.background,
              color: event.color.text,
              textTransform: "none",
              "&:hover": { bgcolor: event.color.background, filter: "brightness(0.97)" },
            }}>
            <Typography variant="caption" noWrap sx={{ lineHeight: 1.2, minWidth: 0 }}>
              <b>{label}</b>{summary && summary !== "—" ? ` · ${summary}` : ""}
            </Typography>
          </Button>
        );
      })}
    </Box>
  );
};

export default CalendarWeekStrip;