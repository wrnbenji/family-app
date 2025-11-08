
-- USERS: Supabase auth.users (nem kell létrehozni)

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id uuid not null references auth.users(id),
  household_id uuid not null references public.households(id) on delete cascade,
  role text not null check (role in ('admin','parent','child')),
  primary key (user_id, household_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  assignee uuid references auth.users(id),
  due_at timestamptz,
  done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  qty text,
  checked boolean not null default false,
  client_tag text,
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- trigger: háztartás létrehozásakor automatikus admin tagság
create or replace function public.add_creator_membership()
returns trigger as $$
begin
  insert into public.memberships(user_id, household_id, role)
  values (new.created_by, new.id, 'admin')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_add_creator_membership on public.households;
create trigger trg_add_creator_membership
after insert on public.households
for each row execute function public.add_creator_membership();
