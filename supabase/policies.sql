
-- Engedélyezd az RLS-t
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.tasks enable row level security;
alter table public.shopping_items enable row level security;
alter table public.events enable row level security;

-- has_member(uid, household_id) ellenőrzés (inline subquery-vel oldjuk)
-- HOUSEHOLDS
drop policy if exists "households_read" on public.households;
create policy "households_read" on public.households
for select using (
  exists (select 1 from public.memberships m
          where m.household_id = id and m.user_id = auth.uid())
);

drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households
for insert with check (auth.uid() = created_by);

drop policy if exists "households_update" on public.households;
create policy "households_update" on public.households
for update using (
  exists (select 1 from public.memberships m
          where m.household_id = id and m.user_id = auth.uid() and m.role in ('admin'))
);

-- MEMBERSHIPS
drop policy if exists "memberships_read" on public.memberships;
create policy "memberships_read" on public.memberships
for select using (
  exists (select 1 from public.memberships m2
          where m2.household_id = memberships.household_id and m2.user_id = auth.uid())
);

drop policy if exists "memberships_insert" on public.memberships;
create policy "memberships_insert" on public.memberships
for insert with check (
  -- csak admin adhat hozzá tagot
  exists (select 1 from public.memberships m2
          where m2.household_id = household_id and m2.user_id = auth.uid() and m2.role in ('admin'))
);

drop policy if exists "memberships_delete" on public.memberships;
create policy "memberships_delete" on public.memberships
for delete using (
  exists (select 1 from public.memberships m2
          where m2.household_id = memberships.household_id and m2.user_id = auth.uid() and m2.role in ('admin'))
);

-- INVITES
drop policy if exists "invites_rw" on public.invites;
create policy "invites_rw" on public.invites
for all using (
  exists (select 1 from public.memberships m
          where m.household_id = invites.household_id and m.user_id = auth.uid())
)
with check (
  exists (select 1 from public.memberships m
          where m.household_id = invites.household_id and m.user_id = auth.uid())
);

-- TASKS / SHOPPING / EVENTS: tagok olvashatják-írhatják
drop policy if exists "tasks_rw" on public.tasks;
create policy "tasks_rw" on public.tasks
for all using (
  exists (select 1 from public.memberships m
          where m.household_id = tasks.household_id and m.user_id = auth.uid())
)
with check (
  exists (select 1 from public.memberships m
          where m.household_id = tasks.household_id and m.user_id = auth.uid())
);

drop policy if exists "shopping_rw" on public.shopping_items;
create policy "shopping_rw" on public.shopping_items
for all using (
  exists (select 1 from public.memberships m
          where m.household_id = shopping_items.household_id and m.user_id = auth.uid())
)
with check (
  exists (select 1 from public.memberships m
          where m.household_id = shopping_items.household_id and m.user_id = auth.uid())
);

drop policy if exists "events_rw" on public.events;
create policy "events_rw" on public.events
for all using (
  exists (select 1 from public.memberships m
          where m.household_id = events.household_id and m.user_id = auth.uid())
)
with check (
  exists (select 1 from public.memberships m
          where m.household_id = events.household_id and m.user_id = auth.uid())
);
