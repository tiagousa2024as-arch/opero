-- Row-Level Security: second line of defense behind the Prisma tenant-scoping
-- extension (packages/database/src/index.ts). Policies key off the session
-- variable `app.tenant_id`, which application code must set with
-- `SET LOCAL app.tenant_id = '<tenantId>'` inside the same transaction as the
-- queries it protects (see `withRlsContext`). When the variable is unset
-- (e.g. a stray connection that forgot to scope itself) the policies default
-- to denying all rows rather than leaking data across tenants.

-- Tables with a direct tenant_id column.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'users', 'customers', 'service_categories', 'service_orders',
      'appointments', 'invoices', 'transactions', 'notifications', 'audit_logs'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;

-- service_order_items has no tenant_id of its own; it inherits tenant scope
-- through its parent service_order.
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON service_order_items
  USING (
    EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = service_order_items.service_order_id
        AND so.tenant_id = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = service_order_items.service_order_id
        AND so.tenant_id = current_setting('app.tenant_id', true)
    )
  );

-- The tenants table itself has no tenant_id — a row's own id is the tenant
-- boundary, and it carries no RLS policy of its own.
--
-- Production note: these policies use FORCE ROW LEVEL SECURITY, so once the
-- app connects as a non-superuser role (as it must in production — the RDS
-- master/superuser role should never be the app's runtime credential),
-- FORCE applies to it too. Any code path that legitimately needs to read
-- across tenants (migrations, seeds, the `/admin/*` back-office) must run
-- through a separate role granted BYPASSRLS, not by relying on
-- superuser status.
