-- Run in the Supabase SQL Editor to allow promo name saves from the calendar.
-- Uses the existing public.profiles(id, role, vendor_id) identity mapping.
-- Existing policies are preserved; these policies add access for the roles below.
begin;

alter table public."Promo_Window" enable row level security;
grant select on public."Promo_Window" to authenticated;
grant update (promo_name) on public."Promo_Window" to authenticated;

drop policy if exists "calendar_promo_name_select" on public."Promo_Window";
create policy "calendar_promo_name_select"
on public."Promo_Window" for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (p.role in ('vendor_admin', 'vendor_manager')
            and p.vendor_id = "Promo_Window".vendor_id)
      )
  )
);

drop policy if exists "calendar_promo_name_update" on public."Promo_Window";
create policy "calendar_promo_name_update"
on public."Promo_Window" for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (p.role in ('vendor_admin', 'vendor_manager')
            and p.vendor_id = "Promo_Window".vendor_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'boschbite_admin'
        or (p.role in ('vendor_admin', 'vendor_manager')
            and p.vendor_id = "Promo_Window".vendor_id)
      )
  )
);

commit;
