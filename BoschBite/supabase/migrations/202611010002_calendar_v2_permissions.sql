begin;

alter table public.calendar_event enable row level security;
alter table public.promo_window_v2 enable row level security;

grant select on public.calendar_event to authenticated;
grant select on public.promo_window_v2 to authenticated;
grant insert (
  vendor_id,
  promo_number,
  promo_name,
  promo_type,
  discount,
  promo_weekday,
  start_date,
  end_date,
  duration_days
) on public.promo_window_v2 to authenticated;
grant update (promo_name) on public.promo_window_v2 to authenticated;

drop policy if exists "calendar_v2_event_select" on public.calendar_event;
create policy "calendar_v2_event_select"
on public.calendar_event for select to authenticated
using (true);

drop policy if exists "calendar_v2_promo_select" on public.promo_window_v2;
create policy "calendar_v2_promo_select"
on public.promo_window_v2 for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (
          p.role in ('vendor_admin', 'vendor_manager')
          and p.vendor_id = promo_window_v2.vendor_id
        )
      )
  )
);

drop policy if exists "calendar_v2_promo_insert" on public.promo_window_v2;
create policy "calendar_v2_promo_insert"
on public.promo_window_v2 for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (
          p.role in ('vendor_admin', 'vendor_manager')
          and p.vendor_id = promo_window_v2.vendor_id
        )
      )
  )
);

drop policy if exists "calendar_v2_promo_update" on public.promo_window_v2;
create policy "calendar_v2_promo_update"
on public.promo_window_v2 for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (
          p.role in ('vendor_admin', 'vendor_manager')
          and p.vendor_id = promo_window_v2.vendor_id
        )
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (
          p.role in ('vendor_admin', 'vendor_manager')
          and p.vendor_id = promo_window_v2.vendor_id
        )
      )
  )
);

commit;
