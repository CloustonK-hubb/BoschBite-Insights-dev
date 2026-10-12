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

type CalendarRow = Record<string, unknown>;

type Identity = {
  role?: string | null;
};

type CalendarEvent = {
  row: CalendarRow;
  rowIndex: number;
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
  const { data: identity } = useGetIdentity<Identity>();
  const isVendor = identity?.role === "vendor_admin" || identity?.role === "vendor_manager";
  const [rows, setRows] = useState<CalendarRow[]>([]);
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
  const [promotionStart, setPromotionStart] = useState("");
  const [promotionEnd, setPromotionEnd] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const [promotionDraft, setPromotionDraft] = useState<{ start: string; end: string } | null>(null);
  const [initialMonthSet, setInitialMonthSet] = useState(false);

  useEffect(() => {
    let active = true;
    const loadCalendar = async () => {
      setLoading(true);
      setLoadError("");
      const { data, error } = await supabaseClient.from("Calendar").select("*");
      if (!active) return;
      if (error) {
        setLoadError(`Unable to load calendar data: ${error.message}`);
        setRows([]);
      } else {
        setRows((data ?? []) as CalendarRow[]);
      }
      setLoading(false);
    };
    void loadCalendar();
    return () => {
      active = false;
    };
  }, []);

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
    if (!dateField) return events;

    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

    rows.forEach((row, rowIndex) => {
      const start = parseDate(row[dateField]);
      const end = endDateField === NO_END_DATE ? start : parseDate(row[endDateField]) ?? start;
      if (!start || !end || end < firstDay || start > lastDay) return;

      const event: CalendarEvent = {
        row,
        rowIndex,
        color: colorForPeriod(row.period_type),
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
        events.set(key, [...(events.get(key) ?? []), event]);
        day.setDate(day.getDate() + 1);
      }
    });

    return events;
  }, [dateField, endDateField, rows, visibleMonth]);

  const gridDays = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const handlePromotionSubmit = () => {
    if (!promotionStart || !promotionEnd) {
      setPromotionError("Choose both a start date and an end date.");
      return;
    }
    if (promotionEnd < promotionStart) {
      setPromotionError("The end date must be on or after the start date.");
      return;
    }
    setPromotionDraft({ start: promotionStart, end: promotionEnd });
    setPromotionError("");
    setPromotionDialogOpen(false);
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
          <Button variant="contained" onClick={() => setPromotionDialogOpen(true)}>
            Set promotion dates
          </Button>
        )}
      </Stack>

      {promotionDraft && isVendor && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Promotion date draft: {promotionDraft.start} to {promotionDraft.end}. This is not saved or linked to a promotion yet.
        </Alert>
      )}

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!loadError && rows.length === 0 && (
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
                {gridDays.map((day) => {
                  const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const inMonth = day.getMonth() === visibleMonth.getMonth();
                  return (
                    <Paper
                      key={key}
                      variant="outlined"
                      sx={{
                        p: 0.75,
                        minHeight: 126,
                        bgcolor: inMonth ? "background.paper" : "action.hover",
                      }}
                    >
                      <Typography variant="caption" color={inMonth ? "text.primary" : "text.disabled"}>
                        {day.getDate()}
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <Button
                            key={`${event.rowIndex}-${key}`}
                            onClick={() => setSelectedEvent(event)}
                            sx={{
                              justifyContent: "flex-start",
                              minWidth: 0,
                              p: 0.5,
                              borderLeft: 3,
                              borderColor: event.color.border,
                              bgcolor: event.color.background,
                              color: event.color.text,
                              textTransform: "none",
                              "&:hover": { bgcolor: event.color.background, filter: "brightness(0.97)" },
                            }}
                          >
                            <Box sx={{ minWidth: 0, textAlign: "left" }}>
                              <Typography variant="caption" fontWeight={700} noWrap display="block">
                                {formatValue(event.row.period_type ?? "Other")}
                              </Typography>
                              <Typography variant="caption" noWrap display="block">
                                {summarizeRow(event.row, dateField, endDateField)}
                              </Typography>
                            </Box>
                          </Button>
                        ))}
                        {dayEvents.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{dayEvents.length - 3} more
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}

          {rows.length > 0 && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
              {[...new Set(rows.map((row) => String(row.period_type ?? "Other")))].map((periodType) => {
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
        <DialogTitle>Calendar record</DialogTitle>
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
          setPromotionDialogOpen(false);
          setPromotionError("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Set promotion dates</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              This creates a draft date range only. It will not be saved or linked to a promotion.
            </Alert>
            {promotionError && <Alert severity="error">{promotionError}</Alert>}
            <TextField
              label="Start date"
              type="date"
              value={promotionStart}
              onChange={(event) => setPromotionStart(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: promotionEnd || undefined }}
              required
            />
            <TextField
              label="End date"
              type="date"
              value={promotionEnd}
              onChange={(event) => setPromotionEnd(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: promotionStart || undefined }}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePromotionSubmit}>Keep draft</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage;
