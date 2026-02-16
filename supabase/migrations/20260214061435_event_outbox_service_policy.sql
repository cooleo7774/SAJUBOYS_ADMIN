-- Explicitly allow service_role access to event_outbox while keeping client access blocked.

drop policy if exists event_outbox_service_all on public.event_outbox;
create policy event_outbox_service_all
  on public.event_outbox
  for all
  to service_role
  using (true)
  with check (true);;
