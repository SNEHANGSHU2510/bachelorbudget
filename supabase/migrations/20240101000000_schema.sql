-- Budgets table
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  total_amount numeric not null,
  currency text not null default 'INR',
  start_date date not null,
  end_date date not null,
  duration_days int generated always as (end_date - start_date + 1) stored,
  created_at timestamptz default now()
);

-- Expenses table
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  budget_id uuid references budgets(id) on delete cascade,
  amount numeric not null,
  currency text not null,
  amount_in_budget_currency numeric not null, -- converted amount
  category text not null, -- 'meals','transport','groceries','entertainment','utilities','health','other'
  note text,
  expense_date date not null default current_date,
  created_at timestamptz default now()
);

-- Daily reserves (auto-calculated carry-forward)
create table daily_reserves (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references budgets(id) on delete cascade,
  reserve_date date not null,
  allocated numeric not null,     -- daily budget for that day
  spent numeric not null default 0,
  reserve numeric generated always as (allocated - spent) stored,
  unique(budget_id, reserve_date)
);

-- Enable RLS on all tables
alter table budgets enable row level security;
alter table expenses enable row level security;
alter table daily_reserves enable row level security;

-- RLS policies (users see only their own data)
create policy "own budgets" on budgets for all using (auth.uid() = user_id);
create policy "own expenses" on expenses for all using (auth.uid() = user_id);
create policy "own reserves" on daily_reserves for all using (
  budget_id in (select id from budgets where user_id = auth.uid())
);

-- Realtime subscriptions via publications
alter publication supabase_realtime add table expenses;
