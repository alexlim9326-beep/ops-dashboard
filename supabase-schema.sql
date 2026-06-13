-- Run this in your Supabase SQL editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Deals (pipeline)
create table deals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  company text,
  contact text,
  value numeric,
  stage text not null default 'prospect' check (stage in ('prospect','qualified','proposal','won','lost')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table deals enable row level security;
create policy "Team can view all deals" on deals for select using (auth.role() = 'authenticated');
create policy "Users manage own deals" on deals for all using (auth.uid() = user_id);

-- Leads
create table leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  company text,
  source text,
  status text not null default 'new' check (status in ('new','contacted','qualified','nurturing','converted','dead')),
  priority text not null default 'low' check (priority in ('low','medium','high')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table leads enable row level security;
create policy "Team can view all leads" on leads for select using (auth.role() = 'authenticated');
create policy "Users manage own leads" on leads for all using (auth.uid() = user_id);

-- Tasks
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  project text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "Team can view all tasks" on tasks for select using (auth.role() = 'authenticated');
create policy "Users manage own tasks" on tasks for all using (auth.uid() = user_id);

-- Meetings
create table meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  date date,
  time time,
  attendees text,
  location text,
  agenda text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table meetings enable row level security;
create policy "Team can view all meetings" on meetings for select using (auth.role() = 'authenticated');
create policy "Users manage own meetings" on meetings for all using (auth.uid() = user_id);

-- Deadlines
create table deadlines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  project text,
  date date not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  done boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table deadlines enable row level security;
create policy "Team can view all deadlines" on deadlines for select using (auth.role() = 'authenticated');
create policy "Users manage own deadlines" on deadlines for all using (auth.uid() = user_id);

-- Updated_at trigger helper
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at before update on deals for each row execute procedure update_updated_at();
create trigger leads_updated_at before update on leads for each row execute procedure update_updated_at();
create trigger tasks_updated_at before update on tasks for each row execute procedure update_updated_at();
create trigger meetings_updated_at before update on meetings for each row execute procedure update_updated_at();
create trigger deadlines_updated_at before update on deadlines for each row execute procedure update_updated_at();
