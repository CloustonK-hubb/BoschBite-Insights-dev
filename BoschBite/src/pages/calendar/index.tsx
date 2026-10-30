import { useEffect, useMemo, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { supabaseClient } from "../../providers/supabaseClient";
import { promotionRunsOnDay, selectDailyPromotions } from "./promotions";

type CalendarRow = Record<string, unknown>;

type Identity = {
  role?: string | null;
  vendor_id?: number | null;
};

type CalendarEvent = {
  row: CalendarRow;
  rowIndex: number;
  isPromotion: boolean;
  color: (typeof PERIOD_COLORS)[number];
};

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NO_END_DATE = "__no_end_date__";

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  let date: Date;
  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      date = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    } else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const dateFieldsIn = (rows: CalendarRow[]) => {
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return fields.filter(
    (field) =>
      /date|day/i.test(field) &&
      rows.some((row) => parseDate(row[field]) !== null),
  );
};

const preferredDateField = (fields: string[]) =>
  fields.find((field) => /^(calendar_)?date$|^(event|period|start)_date$/i.test(field)) ??
  fields[0] ??
  "";

const pairedEndDateField = (startField: string, fields: string[]) => {
  const match = startField.match(/^(.*?)(start|from|begin)(.*)$/i);
  if (match) {
    const candidate = `${match[1]}${match[2].toLowerCase() === "start" ? "end" : match[2].toLowerCase() === "from" ? "to" : "end"}${match[3]}`;
    const field = fields.find((item) => item.toLowerCase() === candidate.toLowerCase());
    if (field) return field;
  }
  const endMatch = startField.match(/^(.*?)(end|to)(.*)$/i);
  if (endMatch) {
    const candidate = `${endMatch[1]}${endMatch[2].toLowerCase() === "end" ? "start" : "from"}${endMatch[3]}`;
    const field = fields.find((item) => item.toLowerCase() === candidate.toLowerCase());
    if (field) return NO_END_DATE;
  }
  return fields.find((field) => field !== startField && /^(end|to)_date$/i.test(field)) ?? NO_END_DATE;
};

const colorForPeriod = (periodType: unknown) => {
  const label = String(periodType ?? "Other");
  const hash = [...label].reduce((value, character) => value + character.charCodeAt(0), 0);
  return PERIOD_COLORS[hash % PERIOD_COLORS.length];
};

const formatValue = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const summarizeRow = (row: CalendarRow, dateField: string, endDateField: string) => {
  const fields = Object.keys(row).filter(
    (field) =>
      field !== "period_type" &&
      field !== dateField &&
      field !== endDateField &&
      !/^(id|.*_id|year)$/i.test(field),
  );
  const field =
    ["function", "name", "title", "description"].find((candidate) => fields.includes(candidate)) ??
    fields[0];
  return field ? formatValue(row[field]) : "";
};

export const CalendarPage = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<Identity>();
  const isVendor = identity?.role === "vendor_admin" || identity?.role === "vendor_manager";
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [loadedPromoRows, setPromoRows] = useState<CalendarRow[]>([]);
  const promoRows = useMemo(
    () => identityLoading || !identity ? [] : isVendor
      ? loadedPromoRows.filter((row) => identity.vendor_id != null && String(row.vendor_id) === String(identity.vendor_id))
      : loadedPromoRows,
    [identityLoading, identity, isVendor, loadedPromoRows],
  );
  const [promoLoadError, setPromoLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dateField, setDateField] = useState("");
  const [endDateField, setEndDateField] = useState(NO_END_DATE);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [promotionName, setPromotionName] = useState("");
  const [promotionSaving, setPromotionSaving] = useState(false);
  const [promotionSuccess, setPromotionSuccess] = useState("");
  const [promotionStart, setPromotionStart] = useState("");
  const [promotionEnd, setPromotionEnd] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const [initialMonthSet, setInitialMonthSet] = useState(false);

  useEffect(() => {
    if (identityLoading || !identity) return;
    let active = true;
    const loadCalendar = async () => {
      setLoading(true);
      setLoadError("");
      setSelectedEvent(null);
      const promotionsQuery = supabaseClient.from("Promo_Window").select("*, Vendor(type_id)");
      const [{ data, error }, promotions] = await Promise.all([
        supabaseClient.from("Calendar").select("*"),
        isVendor
          ? identity.vendor_id == null
            ? Promise.resolve({ data: [], error: null })
            : promotionsQuery.eq("vendor_id", identity.vendor_id)
          : promotionsQuery,
      ]);
      if (!active) return;
      if (error) {
        setLoadError(`Unable to load calendar data: ${error.message}`);
        setRows([]);
      } else {
        setRows((data ?? []) as CalendarRow[]);
      }
      setPromoRows((promotions.data ?? []) as CalendarRow[]);
      setPromoLoadError(isVendor && identity.vendor_id == null
        ? "Your account must be linked to a vendor to view promotions."
        : promotions.error ? `Unable to load promotions: ${promotions.error.message}` : "");
      setLoading(false);
    };
    void loadCalendar();
    return () => {
      active = false;
    };
  }, [identityLoading, identity?.role, identity?.vendor_id]);

  const dateFields = useMemo(() => dateFieldsIn(rows), [rows]);
  const endDateFields = useMemo(
    () => dateFields.filter((field) => field !== dateField),
    [dateFields, dateField],
  );

  useEffect(() => {
    if (!dateFields.length) {
      setDateField("");
      setEndDateField(NO_END_DATE);
      return;
    }
    const nextDateField = dateFields.includes(dateField) ? dateField : preferredDateField(dateFields);
    setDateField(nextDateField);
    setEndDateField((current) =>
      current !== NO_END_DATE && endDateFields.includes(current)
        ? current
        : pairedEndDateField(nextDateField, dateFields),
    );
  }, [dateFields, dateField, endDateFields]);

  useEffect(() => {
    if (loading || initialMonthSet || !dateField) return;
    const latestDate = rows.reduce<Date | null>((latest, row) => {
      const date = parseDate(
        endDateField === NO_END_DATE ? row[dateField] : row[endDateField],
      ) ?? parseDate(row[dateField]);
      return date && (!latest || date > latest) ? date : latest;
    }, null);
    if (latestDate) {
      setVisibleMonth(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));
    }
    setInitialMonthSet(true);
  }, [dateField, endDateField, initialMonthSet, loading, rows]);

  const eventsByDay = useMemo(() => {
    const events = new Map<string, CalendarEvent[]>();

    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

    [...rows, ...promoRows].forEach((row, rowIndex) => {
      const isPromotion = rowIndex >= rows.length;
      const start = parseDate(row[isPromotion ? "start_date" : dateField]);
      const end = isPromotion ? parseDate(row.end_date) ?? start
        : endDateField === NO_END_DATE ? start : parseDate(row[endDateField]) ?? start;
      if (!start || !end || end < firstDay || start > lastDay) return;

      const event: CalendarEvent = {
        row,
        rowIndex,
        isPromotion,
        color: colorForPeriod(isPromotion ? "Promotion" : row.period_type),
      };
      const day = new Date(
        Math.max(start.getTime(), firstDay.getTime()),
      );
      day.setHours(0, 0, 0, 0);
      const lastVisibleDay = new Date(
        Math.min(end.getTime(), lastDay.getTime()),
      );
      lastVisibleDay.setHours(0, 0, 0, 0);

      while (day <= lastVisibleDay) {
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
        if (!isPromotion || promotionRunsOnDay(row, day)) {
          events.set(key, [...(events.get(key) ?? []), event]);
        }
        day.setDate(day.getDate() + 1);
      }
    });

    for (const [key, dayEvents] of events) {
      events.set(key, selectDailyPromotions(dayEvents));
    }
    return events;
  }, [dateField, endDateField, rows, promoRows, visibleMonth]);

  const gridDays = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const calendarWeeks = useMemo(() =>
    Array.from({ length: 6 }, (_, weekIndex) => {
      const days = gridDays.slice(weekIndex * 7, weekIndex * 7 + 7);
      const dayEvents = days.map((day) =>
        eventsByDay.get(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`) ?? [],
      );
      return { days, dayEvents, laneCount: Math.min(3, Math.max(1, ...dayEvents.map((events) => events.length))) };
    }), [gridDays, eventsByDay]);

  const handlePromotionSubmit = async () => {
    if (promotionSaving) return;
    setPromotionError("");
    if (!promotionName.trim()) {
      setPromotionError("Enter a promo name.");
      return;
    }
    if (!promotionStart || !promotionEnd || !parseDate(promotionStart) || !parseDate(promotionEnd)) {
      setPromotionError("Choose both a start date and an end date.");
      return;
    }
    if (promotionEnd < promotionStart) {
      setPromotionError("The end date must be on or after the start date.");
      return;
    }
    if (!isVendor || identity?.vendor_id == null) {
      setPromotionError("Your account must be linked to a vendor to add a promo.");
      return;
    }
    setPromotionSaving(true);
    try {
      const { data, error } = await supabaseClient.from("Promo_Window").insert({
        vendor_id: identity.vendor_id,
        promo_name: promotionName.trim(),
        start_date: promotionStart,
        end_date: promotionEnd,
      }).select("*, Vendor(type_id)").single();
      if (error) throw error;
      setPromoRows((current) => [...current, data as CalendarRow]);
      const start = parseDate(promotionStart)!;
      setVisibleMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      setPromotionSuccess(`Promo "${promotionName.trim()}" added.`);
      setPromotionDialogOpen(false);
      setPromotionName("");
      setPromotionStart("");
      setPromotionEnd("");
    } catch (error) {
      const message = error instanceof Error ? error.message
        : typeof error === "object" && error !== null && "message" in error ? String(error.message)
        : "Please try again.";
      setPromotionError(`Unable to add promo: ${message}`);
    } finally {
      setPromotionSaving(false);
    }
  };

  const moveMonth = (offset: number) =>
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1500, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Calendar</Typography>
        {isVendor && (
          <Button variant="contained" onClick={() => {
            setPromotionError("");
            setPromotionSuccess("");
            setPromotionDialogOpen(true);
          }}>
            Add new promo
          </Button>
        )}
      </Stack>

      {promotionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{promotionSuccess}</Alert>}

      {promoLoadError && <Alert severity="warning" sx={{ mb: 2 }}>{promoLoadError}</Alert>}
      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!loadError && !promoLoadError && rows.length === 0 && promoRows.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>There are no calendar records to display.</Alert>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton aria-label="Previous month" onClick={() => moveMonth(-1)}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 180, textAlign: "center" }}>
                {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Typography>
              <IconButton aria-label="Next month" onClick={() => moveMonth(1)}>
                <ArrowForwardIcon />
              </IconButton>
            </Stack>

            {dateFields.length > 0 && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel id="calendar-start-field-label">Calendar date field</InputLabel>
                  <Select
                    labelId="calendar-start-field-label"
                    value={dateField}
                    label="Calendar date field"
                    onChange={(event) => {
                      const nextField = event.target.value;
                      setDateField(nextField);
                      setEndDateField(pairedEndDateField(nextField, dateFields));
                    }}
                  >
                    {dateFields
                      .filter((field) =>
                        !/^(end|to)_date$/i.test(field) ||
                        !dateFields.some(
                          (other) => other !== field && pairedEndDateField(other, dateFields) === field,
                        ),
                      )
                      .map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel id="calendar-end-field-label">Range end field</InputLabel>
                  <Select
                    labelId="calendar-end-field-label"
                    value={endDateField}
                    label="Range end field"
                    onChange={(event) => setEndDateField(event.target.value)}
                  >
                    <MenuItem value={NO_END_DATE}>Single day</MenuItem>
                    {endDateFields.map((field) => <MenuItem key={field} value={field}>{field}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>

          {dateFields.length === 0 && rows.length > 0 ? (
            <Stack spacing={1}>
              <Alert severity="warning">
                Calendar records loaded, but no date-like column with date values was found. Showing the available records as a table.
              </Alert>
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {[...new Set(rows.flatMap((row) => Object.keys(row)))].map((field) => (
                        <TableCell key={field}>{field}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {[...new Set(rows.flatMap((item) => Object.keys(item)))].map((field) => (
                          <TableCell
                            key={field}
                            sx={field === "period_type" ? {
                              bgcolor: colorForPeriod(row.period_type).background,
                              color: colorForPeriod(row.period_type).text,
                            } : undefined}
                          >
                            {formatValue(row[field])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 760, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.5 }}>
                {WEEKDAYS.map((weekday) => (
                  <Typography key={weekday} variant="subtitle2" align="center" sx={{ py: 1, fontWeight: 700 }}>
                    {weekday}
                  </Typography>
                ))}
                {calendarWeeks.map(({ days, dayEvents, laneCount }, weekIndex) => (
                  <Box key={weekIndex} sx={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", height: 140 }}>
                    {days.map((day, column) => {
                      const inMonth = day.getMonth() === visibleMonth.getMonth();
                      const events = dayEvents[column];
                      const eventHeight = (88 - (laneCount - 1) * 4) / laneCount;
                      return (
                        <Paper
                          key={day.toISOString()}
                          variant="outlined"
                          sx={{ minWidth: 0, height: 140, boxSizing: "border-box", border: 0, boxShadow: "inset 0 0 0 1px rgba(128,128,128,0.25)", borderRadius: 0, bgcolor: inMonth ? "background.paper" : "action.hover" }}
                        >
                          <Typography variant="caption" color={inMonth ? "text.primary" : "text.disabled"} sx={{ display: "block", px: 0.75, height: 28 }}>
                            {day.getDate()}
                          </Typography>
                          <Box
                            key={`${day.toISOString()}-${dateField}-${endDateField}`}
                            tabIndex={events.length > 3 ? 0 : undefined}
                            role="region"
                            aria-label={`Events for ${day.toLocaleDateString()}`}
                            sx={{ height: 88, overflowY: "auto", overflowX: "hidden", overscrollBehaviorY: "contain", scrollSnapType: "y mandatory", scrollbarWidth: "thin" }}
                          >
                            {events.map((event, eventIndex) => {
                              const connectsLeft = dayEvents[column - 1]?.[eventIndex]?.rowIndex === event.rowIndex;
                              const connectsRight = dayEvents[column + 1]?.[eventIndex]?.rowIndex === event.rowIndex;
                              const label = event.isPromotion ? (
                                [event.row.promo_number, event.row.promo_name]
                                  .map((value) => value == null ? "" : String(value).trim())
                                  .find((value) => value !== "") || "Promotion"
                              )
                                : formatValue(event.row.period_type ?? "Other");
                              const summary = event.isPromotion ? "Promotion" : summarizeRow(event.row, dateField, endDateField);
                              return (
                                <Button
                                  key={event.rowIndex}
                                  onClick={() => setSelectedEvent(event)}
                                  title={`${label}: ${summary}`}
                                  sx={{
                                    display: "flex",
                                    width: `calc(100% - ${connectsLeft ? 0 : 6}px - ${connectsRight ? 0 : 6}px)`,
                                    ml: connectsLeft ? 0 : "6px",
                                    mr: connectsRight ? 0 : "6px",
                                    mb: eventIndex === events.length - 1 ? 0 : "4px",
                                    height: eventHeight,
                                    minHeight: eventHeight,
                                    minWidth: 0,
                                    scrollSnapAlign: "start",
                                    justifyContent: "flex-start",
                                    px: 0.5,
                                    py: 0,
                                    borderRadius: `${connectsLeft ? 0 : 4}px ${connectsRight ? 0 : 4}px ${connectsRight ? 0 : 4}px ${connectsLeft ? 0 : 4}px`,
                                    borderLeft: connectsLeft ? 0 : 3,
                                    borderColor: event.color.border,
                                    bgcolor: event.color.background,
                                    color: event.color.text,
                                    textTransform: "none",
                                    "&:hover": { bgcolor: event.color.background, filter: "brightness(0.97)" },
                                  }}
                                >
                                  <Box sx={{ minWidth: 0, textAlign: "left" }}>
                                    <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.2 }}>
                                      {label}
                                    </Typography>
                                    {laneCount < 3 && (
                                      <Typography variant="caption" noWrap display="block" sx={{ lineHeight: 1.2 }}>{summary}</Typography>
                                    )}
                                  </Box>
                                </Button>
                              );
                            })}
                          </Box>
                          {events.length > 3 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 0.75, fontSize: "0.65rem" }}>
                              Scroll for {events.length - 3} more
                            </Typography>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {(rows.length > 0 || promoRows.length > 0) && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
              {[...new Set([...rows.map((row) => String(row.period_type ?? "Other")), ...(promoRows.length ? ["Promotion"] : [])])].map((periodType) => {
                const color = colorForPeriod(periodType);
                return (
                  <Chip
                    key={periodType}
                    label={periodType}
                    size="small"
                    sx={{ bgcolor: color.background, color: color.text, border: `1px solid ${color.border}` }}
                  />
                );
              })}
            </Stack>
          )}
        </>
      )}

      <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedEvent?.isPromotion ? "Promotion record" : "Calendar record"}</DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <Stack spacing={1}>
              {Object.entries(selectedEvent.row).map(([field, value]) => (
                <Box key={field} sx={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 2fr", gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{field}</Typography>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{formatValue(value)}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promotionDialogOpen}
        onClose={() => {
          if (promotionSaving) return;
          setPromotionDialogOpen(false);
          setPromotionError("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add new promo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {promotionError && <Alert severity="error">{promotionError}</Alert>}
            <TextField
              label="Promo name"
              value={promotionName}
              onChange={(event) => setPromotionName(event.target.value)}
              disabled={promotionSaving}
              autoFocus
              required
            />
            <TextField
              label="Start date"
              type="date"
              disabled={promotionSaving}
              value={promotionStart}
              onChange={(event) => setPromotionStart(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: promotionEnd || undefined }}
              required
            />
            <TextField
              label="End date"
              type="date"
              disabled={promotionSaving}
              value={promotionEnd}
              onChange={(event) => setPromotionEnd(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: promotionStart || undefined }}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={promotionSaving} onClick={() => setPromotionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={promotionSaving} onClick={handlePromotionSubmit}>
            {promotionSaving ? "Saving..." : "Add promo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage;
