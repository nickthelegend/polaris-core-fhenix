-- 1. Performance Indices (Critical for Production)
-- Index on Bill Hash (Critical for Checkout Page Lookup)
CREATE INDEX IF NOT EXISTS idx_projects_bills_hash ON public.projects_bills(hash);

-- Index on Merchant Client ID (Critical for API Auth)
CREATE INDEX IF NOT EXISTS idx_merchant_apps_client_id ON public.merchant_apps(client_id);

-- Index on App ID for Webhooks (For efficient event dispatch)
CREATE INDEX IF NOT EXISTS idx_webhooks_app_id ON public.webhooks(app_id);

-- 2. Schema Enhancements
-- Add 'settlement_address' to merchant_apps for direct fund routing
ALTER TABLE public.merchant_apps 
ADD COLUMN IF NOT EXISTS settlement_address text;

-- 3. Automatic Timestamp Updates (Utility)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to merchant_apps
DROP TRIGGER IF EXISTS update_merchant_apps_updated_at ON public.merchant_apps;
CREATE TRIGGER update_merchant_apps_updated_at
    BEFORE UPDATE ON public.merchant_apps
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Apply trigger to project_bills (if updated_at exists, or add it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects_bills' AND column_name='updated_at') THEN
        ALTER TABLE public.projects_bills ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_projects_bills_updated_at ON public.projects_bills;
CREATE TRIGGER update_projects_bills_updated_at
    BEFORE UPDATE ON public.projects_bills
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
