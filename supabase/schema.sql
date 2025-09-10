-- Supabase schema for Fleet demo
-- Run in Supabase SQL editor (free tier). RLS kept permissive for demo; harden before production.

create table if not exists trucks (
  id text primary key,
  plate text not null,
  make text,
  model text,
  year int,
  mileage int,
  status text
);

create table if not exists trailers (
  id text primary key,
  code text not null,
  type text,
  capacity int,
  status text
);

create table if not exists repairs (
  id text primary key,
  assetType text,
  assetId text,
  date date,
  description text,
  cost numeric,
  status text
);

create table if not exists expenses (
  id text primary key,
  category text,
  amount numeric,
  date date,
  notes text
);

create table if not exists cases (
  id text primary key,
  assetType text,
  assetId text,
  title text,
  priority text,
  stage text,
  createdAt bigint,
  cost numeric,
  assigned text,
  timeline jsonb,
  invoices jsonb
);

-- Enable RLS with simple permissive policies (adjust as needed)
alter table trucks enable row level security;
alter table trailers enable row level security;
alter table repairs enable row level security;
alter table expenses enable row level security;
alter table cases enable row level security;

create policy "public read" on trucks for select using (true);
create policy "public write" on trucks for insert with check (true);
create policy "public update" on trucks for update using (true);
create policy "public delete" on trucks for delete using (true);

create policy "public read" on trailers for select using (true);
create policy "public write" on trailers for insert with check (true);
create policy "public update" on trailers for update using (true);
create policy "public delete" on trailers for delete using (true);

create policy "public read" on repairs for select using (true);
create policy "public write" on repairs for insert with check (true);
create policy "public update" on repairs for update using (true);
create policy "public delete" on repairs for delete using (true);

create policy "public read" on expenses for select using (true);
create policy "public write" on expenses for insert with check (true);
create policy "public update" on expenses for update using (true);
create policy "public delete" on expenses for delete using (true);

create policy "public read" on cases for select using (true);
create policy "public write" on cases for insert with check (true);
create policy "public update" on cases for update using (true);
create policy "public delete" on cases for delete using (true);
