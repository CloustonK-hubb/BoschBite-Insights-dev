type Promotion = Record<string, unknown>;

export const MANUAL_PROMOTION_KEYS_STORAGE = "boschbite.manualPromotionKeys";

export const readManualPromotionKeys = () => {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const stored = JSON.parse(window.localStorage.getItem(MANUAL_PROMOTION_KEYS_STORAGE) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set<string>();
  }
};

export const promotionKey = (row: Promotion) =>
  row.promo_id != null ? String(row.promo_id)
    : `${String(row.vendor_id ?? "")}-${String(row.promo_number ?? "")}`;

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const promotionRunsOnDay = (row: Promotion, day: Date) => {
  if (String(row.promo_type ?? "").toLowerCase() !== "weekly") return true;
  const weekday = row.promo_weekday;
  if (typeof weekday === "number") {
    const javascriptWeekday = weekday === 7 ? 0 : weekday;
    return javascriptWeekday === day.getDay();
  }
  return String(weekday ?? "").trim().toLowerCase() === weekdays[day.getDay()];
};

// Keep each vendor type's daily selection separate from other types and calendar events.
export const selectDailyPromotions = <T extends { row: Promotion; isPromotion: boolean }>(events: T[]): T[] => {
  const groups = new Map<string, T[]>();
  for (const event of events) {
    if (!event.isPromotion) continue;
    const vendor = (event.row.vendor ?? event.row.Vendor) as { type_id?: unknown } | null;
    const key = String(vendor?.type_id ?? event.row.type_id ?? `vendor:${event.row.vendor_id}`);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  const selected = new Set<T>();
  for (const group of groups.values()) {
    const ranked = [...group].sort((a, b) =>
      Number(b.row.discount ?? 0) - Number(a.row.discount ?? 0) ||
      Number(b.row.duration_days ?? 0) - Number(a.row.duration_days ?? 0) ||
      Number(a.row.promo_id ?? 0) - Number(b.row.promo_id ?? 0),
    );
    for (const weekly of [false, true]) {
      ranked.filter(({ row }) => (String(row.promo_type ?? "").toLowerCase() === "weekly") === weekly)
        .slice(0, weekly ? 1 : 2).forEach((event) => selected.add(event));
    }
  }
  return events.filter((event) => !event.isPromotion || selected.has(event));
};
