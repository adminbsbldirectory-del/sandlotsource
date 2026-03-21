alter table public.facilities
add column if not exists facility_type text,
add column if not exists sport_served text;

update public.facilities
set facility_type = null
where trim(coalesce(facility_type, '')) = '';

update public.facilities
set facility_type = 'park_field'
where lower(trim(facility_type)) in (
  'park',
  'field',
  'park field',
  'park/field',
  'city park',
  'county park',
  'rec field',
  'recreation field',
  'city/county park field/facility',
  'city county park',
  'city/county park'
);

update public.facilities
set facility_type = 'training_facility'
where lower(trim(facility_type)) in (
  'training',
  'training facility',
  'academy',
  'indoor facility',
  'indoor training',
  'lesson facility'
);

update public.facilities
set facility_type = 'travel_team_facility'
where lower(trim(facility_type)) in (
  'travel team',
  'travel team facility',
  'team facility',
  'organization facility'
);

update public.facilities
set facility_type = 'school_field'
where lower(trim(facility_type)) in (
  'school',
  'school field',
  'high school',
  'middle school',
  'school facility'
);

update public.facilities
set facility_type = 'other'
where facility_type is not null
  and facility_type not in (
    'park_field',
    'training_facility',
    'travel_team_facility',
    'school_field',
    'other'
  );

update public.facilities
set sport_served = 'both'
where sport_served is null
   or trim(coalesce(sport_served, '')) = '';

update public.facilities
set sport_served = 'baseball'
where lower(trim(sport_served)) in ('baseball', 'baseball only');

update public.facilities
set sport_served = 'softball'
where lower(trim(sport_served)) in ('softball', 'softball only');

update public.facilities
set sport_served = 'both'
where lower(trim(sport_served)) in ('both', 'baseball and softball', 'baseball/softball');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'facilities_facility_type_check'
  ) then
    alter table public.facilities
    add constraint facilities_facility_type_check
    check (
      facility_type is null
      or facility_type in (
        'park_field',
        'training_facility',
        'travel_team_facility',
        'school_field',
        'other'
      )
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'facilities_sport_served_check'
  ) then
    alter table public.facilities
    add constraint facilities_sport_served_check
    check (
      sport_served in (
        'baseball',
        'softball',
        'both'
      )
    );
  end if;
end $$;

create index if not exists idx_facilities_facility_type
  on public.facilities (facility_type);

create index if not exists idx_facilities_sport_served
  on public.facilities (sport_served);
