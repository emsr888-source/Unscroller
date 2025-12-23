BEGIN;

-- Ensure RLS policies exist on backend-managed tables so db doctor warnings clear
ALTER TABLE IF EXISTS public.entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entitlements_service_role_access ON public.entitlements;
CREATE POLICY entitlements_service_role_access ON public.entitlements
  USING (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_service_role_access ON public.events;
CREATE POLICY events_service_role_access ON public.events
  USING (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscriptions_service_role_access ON public.subscriptions;
CREATE POLICY subscriptions_service_role_access ON public.subscriptions
  USING (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_service_role_access ON public.tenants;
CREATE POLICY tenants_service_role_access ON public.tenants
  USING (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

COMMIT;
