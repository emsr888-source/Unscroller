BEGIN;

-- Ensure RLS is enforced on the backend-managed public.users table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Allow access only from service role tokens or privileged database roles
DROP POLICY IF EXISTS users_service_role_access ON public.users;
CREATE POLICY users_service_role_access ON public.users
  USING (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );

COMMIT;
