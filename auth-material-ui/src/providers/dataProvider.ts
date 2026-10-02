import type { DataProvider, HttpError } from "@refinedev/core";
import { supabaseClient } from "./supabaseClient";

// Refine expects errors shaped like { message, statusCode }
const toHttpError = (error: { message: string }): HttpError => ({
  message: error.message,
  statusCode: 500,
});

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const { currentPage = 1, pageSize = 10 } = pagination ?? {};
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseClient
      .from(resource)
      .select("*", { count: "exact" });

    filters?.forEach((filter) => {
      if (!("field" in filter)) return;
      if (filter.operator === "eq") query = query.eq(filter.field, filter.value);
      if (filter.operator === "contains")
        query = query.ilike(filter.field, `%${filter.value}%`);
    });

    sorters?.forEach((sorter) => {
      query = query.order(sorter.field, { ascending: sorter.order === "asc" });
    });

    const { data, error, count } = await query.range(from, to);
    if (error) throw toHttpError(error);

    return { data: data ?? [], total: count ?? 0 };
  },

  getOne: async ({ resource, id, meta }) => {
    const idColumn: string = meta?.idColumnName ?? "id"
    const { data, error } = await supabaseClient
      .from(resource)
      .select("*")
      .eq(idColumn, id)
      .single();

    if (error) throw toHttpError(error);
    return { data };
  },

  create: async ({ resource, variables }) => {
    const { data, error } = await supabaseClient
      .from(resource)
      .insert(variables as object)
      .select()
      .single();

    if (error) throw toHttpError(error);
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const { data, error } = await supabaseClient
      .from(resource)
      .update(variables as object)
      .eq("id", id)
      .select()
      .single();

    if (error) throw toHttpError(error);
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data, error } = await supabaseClient
      .from(resource)
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw toHttpError(error);
    return { data };
  },

  getApiUrl: () => import.meta.env.VITE_SUPABASE_URL,
};