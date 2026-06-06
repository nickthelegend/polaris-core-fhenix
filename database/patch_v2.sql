
-- 1. Patch Pools table for Cross-Chain Stats
ALTER TABLE pools ADD COLUMN IF NOT EXISTS token_address TEXT;
ALTER TABLE pools ADD COLUMN IF NOT EXISTS chain_id BIGINT;
ALTER TABLE pools ADD COLUMN IF NOT EXISTS physical_balance NUMERIC DEFAULT 0;
ALTER TABLE pools ADD COLUMN IF NOT EXISTS lp_balance NUMERIC DEFAULT 0;

-- 2. Ensure Deposits table is correct
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS hub_tx_hash TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS user_address TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS token_address TEXT;

-- 3. Seed Initial Pool Data for Sepolia and USC Hub
DELETE FROM pools; -- Clear old if any to avoid conflicts during patch

INSERT INTO pools (name, token_address, chain_id, tvl, apr, utilization, available_liquidity, physical_balance, lp_balance)
VALUES 
('USDC_VAULT', '0xA715e84556b03aBdaC42aa421b5D6081A5434a2F', 11155111, 1000000, 5.0, 0, 1000000, 1000, 1000),
('USDT_VAULT', '0x87A0E38fF8e63AE90ea95bbd61Ce9c6EC75422d0', 11155111, 500000, 4.5, 0, 500000, 500, 500);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
