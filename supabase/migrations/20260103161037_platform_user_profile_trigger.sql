-- Create user profile on auth signup
create or replace function platform.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = platform, public
as $$
begin
  insert into platform.user_profiles (
    user_id,
    email,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger on Supabase Auth users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function platform.handle_new_auth_user();