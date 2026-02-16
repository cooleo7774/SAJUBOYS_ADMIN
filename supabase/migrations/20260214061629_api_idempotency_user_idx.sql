create index if not exists api_idempotency_user_created_idx
  on public.api_idempotency_keys (user_id, created_at desc);;
