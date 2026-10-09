import { useEffect, useState } from "react";
import { supabaseClient } from "../../providers/supabaseClient";

export type Period = "day" | "week" | "month";
export type Grain = "day" | "week";

export interface VendorOption { vendor_id: number; name: string; type_id: number | null }
export interface TypeOption { type_id: number; name: string }
export interface MarketStats {
  total_vendors: number;
  promotions_running: number;
  total_transactions: number;
  daily_revenue: number | null;
  peak_mealtime: string | null;
  total_discount_given: number | null;
  orders_per_student: number | null;
  revenue_growth_pct: number | null;
  avg_revenue_per_vendor: number | null;
  avg_transactions_per_vendor: number | null;
  avg_order_value: number | null;
}
export interface VendorStats {
  revenue: number;
  revenue_change_pct: number | null;
  orders: number;
  orders_change_pct: number | null;
  avg_order_value: number | null;
  avg_order_value_change_pct: number | null;
  todays_orders: number;
  todays_avg_order_value: number | null;
  active_promotions: number;
}
export interface PromoEffect {
  promo_days: number;
  baseline_days: number;
  orders_uplift_pct: number | null;
  revenue_uplift_pct: number | null;
  discount_cost: number;
  revenue_per_rand_discount: number | null;
}
export interface AovPoint { period_start: string; avg_order_value: number; orders: number; revenue: number }
export interface MealRow { meal_period: string; revenue: number; orders: number }
export interface HourRow { hour_of_day: number; orders: number }
export interface PeerRow {
  peer_count: number;
  vendor_avg_order_value: number;
  peer_median_avg_order_value: number;
  percentile: number;
  verdict: string;
}

type Result = { data: unknown; error: { message: string } | null };

// Runs a Supabase call and keeps its rows and error in state.
// Pass null to skip the call (for example before a vendor is chosen).
function useLoad<T>(load: (() => PromiseLike<Result>) | null, deps: unknown[]) {
  const [state, setState] = useState<{ data: T[] | null; error: string | null }>({
    data: null,
    error: null,
  });
  useEffect(() => {
    if (!load) {
      setState({ data: null, error: null });
      return;
    }
    let live = true;
    load().then(({ data, error }) => {
      if (!live) return;
      setState({ data: error ? null : ((data ?? []) as T[]), error: error?.message ?? null });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const rpc = (fn: string, args: Record<string, unknown>) => () =>
  Promise.resolve(supabaseClient.rpc(fn, args));

export const useVendors = () =>
  useLoad<VendorOption>(
    () => Promise.resolve(supabaseClient.from("Vendor").select("vendor_id,name,type_id").order("name")),
    [],
  );

export const useTypes = () =>
  useLoad<TypeOption>(
    () => Promise.resolve(supabaseClient.from("Vendor_Type").select("type_id,name").order("name")),
    [],
  );

export const useMarketStats = (period: Period, typeId: number | null) =>
  useLoad<MarketStats>(rpc("kpi_market_stats", { p_period: period, p_type_id: typeId }), [period, typeId]);

export const useVendorStats = (vid: number | null, period: Period) =>
  useLoad<VendorStats>(vid ? rpc("kpi_vendor_stats", { p_vendor_id: vid, p_period: period }) : null, [vid, period]);

export const usePromoEffect = (vid: number | null) =>
  useLoad<PromoEffect>(vid ? rpc("kpi_promo_effectiveness", { p_vendor_id: vid }) : null, [vid]);

export const useAovOverTime = (vid: number | null, grain: Grain) =>
  useLoad<AovPoint>(
    vid
      ? rpc("kpi_aov_over_time", { p_vendor_id: vid, p_grain: grain, p_days: grain === "week" ? 90 : 30 })
      : null,
    [vid, grain],
  );

export const useMeals = (vid: number | null, period: Period) =>
  useLoad<MealRow>(vid ? rpc("kpi_revenue_by_mealtime", { p_vendor_id: vid, p_period: period }) : null, [vid, period]);

export const useHours = (vid: number | null, period: Period) =>
  useLoad<HourRow>(vid ? rpc("kpi_busiest_hours", { p_vendor_id: vid, p_period: period }) : null, [vid, period]);

export const usePeer = (vid: number | null, period: Period) =>
  useLoad<PeerRow>(vid ? rpc("kpi_peer_benchmark", { p_vendor_id: vid, p_period: period }) : null, [vid, period]);