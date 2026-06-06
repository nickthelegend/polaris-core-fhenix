-- Migration: Unified Merchant Billing System
-- Description: Connects Merchant Platform (merchant_apps) to Billing (bills)

-- 1. Ensure bills table handles merchant_apps reference
-- We use UUID for bills to make hashes secure and unguessable
CREATE TABLE IF NOT EXISTS projects_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID REFERENCES merchant_apps(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL DEFAULT 'USDC',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'expired'
  hash TEXT UNIQUE NOT NULL, -- The payment identifier (Bill-Hash)
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  tx_hash TEXT, -- Creditcoin/Obolus tx hash after settlement on Master
  user_address TEXT -- Wallet address of the payer
);

-- 2. Add indices for high-perf lookups
CREATE INDEX IF NOT EXISTS idx_bills_hash ON projects_bills(hash);
CREATE INDEX IF NOT EXISTS idx_bills_app_id ON projects_bills(app_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON projects_bills(status);

-- 3. Row Level Security
ALTER TABLE projects_bills ENABLE ROW LEVEL SECURITY;

-- 4. Policies (allow platform/app to manage)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Bills') THEN
        CREATE POLICY "Public Read Bills" ON projects_bills FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Bills') THEN
        CREATE POLICY "Public Insert Bills" ON projects_bills FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update Bills') THEN
        CREATE POLICY "Public Update Bills" ON projects_bills FOR UPDATE USING (true);
    END IF;
END $$;
