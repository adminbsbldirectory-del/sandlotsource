-- ============================================================
-- GA Coach Directory — Supabase Schema
-- Run this in Supabase > SQL Editor > New Query
-- ============================================================

-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- ============================================================
-- COACHES TABLE
-- ============================================================
create table if not exists coaches (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Identity
  name text not null,
  sport text check (sport in ('baseball', 'softball', 'both')) default 'baseball',
  specialty text[], -- ['pitching', 'hitting', 'catching', 'fielding', 'speed']

  -- Location
  city text,
  county text,
  facility_name text,
  address text,
  lat double precision,
  lng double precision,
  location geography(point, 4326),

  -- Contact
  phone text,
  email text,
  website text,
  instagram text,
  facebook text,

  -- Details
  bio text,
  credentials text,         -- "Former MLB pitcher, 10 years coaching"
  age_groups text[],        -- ['6U','8U','10U','12U','14U','16U','18U']
  skill_level text[],       -- ['beginner','intermediate','advanced','elite']
  price_per_session integer, -- in dollars
  price_notes text,

  -- Meta
  tier text check (tier in ('elite','strong','local','budget')) default 'local',
  source text,              -- 'facebook','flyer','manual'
  verified boolean default false,
  active boolean default true,
  recommendation_count integer default 0,
  notes text,

  -- Expiry
  listing_expires_at timestamp with time zone default (now() + interval '6 months'),
  last_confirmed_at timestamp with time zone default now()
);

-- ============================================================
-- FACILITIES TABLE
-- ============================================================
create table if not exists facilities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),

  name text not null,
  sport text check (sport in ('baseball', 'softball', 'both')) default 'both',
  city text,
  county text,
  address text,
  lat double precision,
  lng double precision,
  location geography(point, 4326),

  phone text,
  website text,
  instagram text,

  description text,
  amenities text[],         -- ['HitTrax','Rapsodo','Hack Attack','cages','turf']
  active boolean default true,
  notes text
);

-- ============================================================
-- TRAVEL TEAMS TABLE
-- ============================================================
create table if not exists travel_teams (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),

  name text not null,
  sport text check (sport in ('baseball', 'softball', 'both')) default 'baseball',
  org_affiliation text,     -- 'USSSA','Perfect Game','PGF', etc.
  age_group text,           -- '10U','12U', etc.
  city text,
  county text,

  contact_name text,
  contact_email text,
  contact_phone text,
  website text,

  tryout_status text check (tryout_status in ('open','closed','by_invite','year_round')) default 'closed',
  tryout_date date,
  tryout_notes text,

  description text,
  active boolean default true,
  listing_expires_at timestamp with time zone default (now() + interval '6 months')
);

-- ============================================================
-- PLAYER BOARD TABLE
-- ============================================================
create table if not exists player_board (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),

  post_type text check (post_type in ('player_available','team_need')) not null,
  sport text check (sport in ('baseball', 'softball')) not null,

  -- For player_available posts
  player_age integer,
  player_position text[],
  player_description text,

  -- For team_need posts
  team_name text,
  position_needed text[],
  age_group text,

  -- Shared
  city text,
  county text,
  contact_info text,
  additional_notes text,

  active boolean default true,
  expires_at timestamp with time zone default (now() + interval '30 days')
);

-- ============================================================
-- INDEXES for geo queries
-- ============================================================
create index if not exists coaches_location_idx on coaches using gist(location);
create index if not exists facilities_location_idx on facilities using gist(location);
create index if not exists coaches_sport_idx on coaches(sport);
create index if not exists coaches_active_idx on coaches(active);

-- ============================================================
-- AUTO-UPDATE location from lat/lng
-- ============================================================
create or replace function update_location()
returns trigger as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location = st_point(new.lng, new.lat)::geography;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger coaches_location_trigger
  before insert or update on coaches
  for each row execute function update_location();

create trigger facilities_location_trigger
  before insert or update on facilities
  for each row execute function update_location();

-- ============================================================
-- ROW LEVEL SECURITY (public read, no public write)
-- ============================================================
alter table coaches enable row level security;
alter table facilities enable row level security;
alter table travel_teams enable row level security;
alter table player_board enable row level security;

-- Public can read active listings
create policy "Public read coaches" on coaches for select using (active = true);
create policy "Public read facilities" on facilities for select using (active = true);
create policy "Public read travel_teams" on travel_teams for select using (active = true);
create policy "Public read player_board" on player_board for select using (active = true);

-- Public can insert player board posts
create policy "Public insert player_board" on player_board for insert with check (true);
