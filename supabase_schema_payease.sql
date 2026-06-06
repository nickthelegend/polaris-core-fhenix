-- Merchants App Table
create table merchant_apps (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  client_id text unique not null,
  client_secret text not null,
  wallet_address text,
  escrow_contract text,
  category text,
  user_id uuid references auth.users(id)
);

-- Bills Table (for the main app)
create table projects_bills (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  app_id uuid references merchant_apps(id) not null,
  amount numeric not null,
  asset text default 'USDC',
  description text,
  metadata jsonb,
  hash text unique not null,
  status text default 'pending', -- pending, paid, cancelled
  tx_hash text
);

-- RLS
alter table merchant_apps enable row level security;
alter table projects_bills enable row level security;

create policy "Public read access to merchant_apps" on merchant_apps for select using (true);
create policy "Public read bills" on projects_bills for select using (true);
create policy "Insert bills via API" on projects_bills for insert with check (true);
create policy "Update bills via API" on projects_bills for update using (true);
