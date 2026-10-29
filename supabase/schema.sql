-- SolarGuide Ethiopia (solarguide-et) Database Schema & Row Level Security (RLS)
-- Run this SQL in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- 1. quote_requests table
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  city text not null,
  daily_kwh numeric not null,
  panel_kw numeric not null,
  battery_kwh numeric not null,
  estimated_cost_low numeric not null,
  estimated_cost_high numeric not null,
  created_at timestamptz not null default now(),
  status text not null default 'new'
);

-- 2. installers table
create table if not exists public.installers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  city text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS) on both tables
alter table public.quote_requests enable row level security;
alter table public.installers enable row level security;

-- RLS Policies for quote_requests:
-- Anonymous (public) users can ONLY INSERT into quote_requests.
-- No SELECT, UPDATE, or DELETE policies exist for anon/authenticated roles,
-- so nobody can read quote_requests from the public client.
drop policy if exists "Allow anonymous insert on quote_requests" on public.quote_requests;
create policy "Allow anonymous insert on quote_requests"
  on public.quote_requests
  for insert
  to anon, authenticated
  with check (true);

-- RLS Policies for installers:
-- No public policies are defined on public.installers.
-- With RLS enabled and no policies for anon/authenticated, installers is not publicly readable or writable.
-- Server-side queries using SUPABASE_SERVICE_ROLE_KEY bypass RLS safely on the server.
