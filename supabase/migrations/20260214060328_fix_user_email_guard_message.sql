-- Align prevent_user_email_change exception text with repository source.

create or replace function public.prevent_user_email_change()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_user_email_guard', true) = '1' then
    return new;
  end if;

  if new.email is distinct from old.email then
    raise exception 'email_must_be_updated_via_auth_provider';
  end if;
  return new;
end;
$$;;
