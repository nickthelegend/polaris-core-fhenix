-- Migration: Fix Unique Constraints for Multichain Pools
-- Description: Removes the rigid 'unique_pool_name' constraint and replaces it with a composite (name, chain_id) constraint.

-- 1. Drop the legacy unique constraint on name only
-- The error message identified it as 'unique_pool_name'
-- We also try 'pools_name_key' just in case of different environments
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_pool_name') THEN
        ALTER TABLE public.pools DROP CONSTRAINT unique_pool_name;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pools_name_key') THEN
        ALTER TABLE public.pools DROP CONSTRAINT pools_name_key;
    END IF;
END $$;

-- 2. Ensure the required columns exist
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS token_address text;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS chain_id bigint;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS network_name text;

-- 3. Backfill chain_id for existing Sepolia vaults if they are missing it
UPDATE public.pools SET chain_id = 11155111, network_name = 'Sepolia' 
WHERE chain_id IS NULL AND (name = 'USDC_VAULT' OR name = 'USDT_VAULT');

-- 4. Add the new composite unique constraint
ALTER TABLE public.pools ADD CONSTRAINT pools_name_chain_id_key UNIQUE (name, chain_id);

-- 5. Insert/Update Vaults for SEPOLIA (11155111)
INSERT INTO public.pools (name, token_address, chain_id, network_name, apr, tvl)
VALUES 
('USDC_VAULT', '0xA715e84556b03aBdaC42aa421b5D6081A5434a2F', 11155111, 'Sepolia', 10.5, 1000000),
('USDT_VAULT', '0x87A0E38fF8e63AE90ea95bbd61Ce9c6EC75422d0', 11155111, 'Sepolia', 9.8, 500000),
('AVAX_VAULT', '0x5b731C3e54b7aC7A5516861eac9704aDBC480584', 11155111, 'Sepolia', 8.5, 0),
('WBTC_VAULT', '0x4105F990aBd92f8CCCD8c58433963B862C4b34a5', 11155111, 'Sepolia', 4.2, 0),
('WETH_VAULT', '0x35504AceAea50B3dbeF640618b535feDB2db680B', 11155111, 'Sepolia', 5.5, 0),
('LINK_VAULT', '0x1929264FC968770A72021fE29aD5d9e4344ef152', 11155111, 'Sepolia', 6.0, 0),
('BNB_VAULT', '0xd376252519348D8d219C250E374CE81A1B528BE5', 11155111, 'Sepolia', 10.2, 0)
ON CONFLICT (name, chain_id) DO UPDATE SET 
    token_address = EXCLUDED.token_address,
    network_name = EXCLUDED.network_name,
    apr = EXCLUDED.apr,
    tvl = EXCLUDED.tvl;

-- 6. Insert Vaults for AVALANCHE FUJI (43113)
INSERT INTO public.pools (name, token_address, chain_id, network_name, apr, tvl)
VALUES 
('USDC_FUJI', '0x7F7FfeC9a7a6DC8B383606BE86DE5bE9e99a1302', 43113, 'Fuji', 12.0, 0),
('USDT_FUJI', '0xDE7bB3d5d37Cc4A4eCdd0Fd10C9AF92B545C89c2', 43113, 'Fuji', 11.5, 0),
('AVAX_FUJI', '0x21B15447514649C7cb934cA01c2528ff52Daa84b', 43113, 'Fuji', 15.0, 0),
('WBTC_FUJI', '0xbCFCF4D1B880Ea38b71E45394FaCC5b71678C44A', 43113, 'Fuji', 6.5, 0),
('WETH_FUJI', '0x0a60F63B187F9BBa95F213fC7eca447239E10603', 43113, 'Fuji', 7.2, 0),
('LINK_FUJI', '0x4f8295bf1bE96b548aa0384673415217c4afed99', 43113, 'Fuji', 8.0, 0),
('BNB_FUJI', '0xE6f01d32851A30Fb8C8A02142d5d1E333574312a', 43113, 'Fuji', 9.5, 0)
ON CONFLICT (name, chain_id) DO UPDATE SET 
    token_address = EXCLUDED.token_address,
    network_name = EXCLUDED.network_name;

-- 7. Insert Vaults for BASE SEPOLIA (84532)
INSERT INTO public.pools (name, token_address, chain_id, network_name, apr, tvl)
VALUES 
('USDC_BASE', '0xD221D9E4F6E6709a3cf38cEC57662bbC7F60f3Df', 84532, 'Base', 10.5, 0),
('USDT_BASE', '0xf2411f2C27a619Ab40001A956fEd625DBFa458AF', 84532, 'Base', 10.2, 0),
('AVAX_BASE', '0x369B65aaD1c39159a0f860012f59D0F4c3484812', 84532, 'Base', 8.0, 0),
('WBTC_BASE', '0x5A1D3939C5b3a43B36Dc42C816bc5c0F02c1C261', 84532, 'Base', 4.5, 0),
('WETH_BASE', '0x8C213a3Db9187966Ebf8DfD0488A225044265AeF', 84532, 'Base', 6.2, 0),
('LINK_BASE', '0x9f40bfe80fADa11569c68d2DFb9f3250841C572E', 84532, 'Base', 7.5, 0),
('BNB_BASE', '0xBa403C90a5FE4BDfD2a4705bA7C2fA30F47Aa2e1', 84532, 'Base', 9.0, 0)
ON CONFLICT (name, chain_id) DO UPDATE SET 
    token_address = EXCLUDED.token_address,
    network_name = EXCLUDED.network_name;

-- 8. Insert Vaults for CRONOS TESTNET (338)
INSERT INTO public.pools (name, token_address, chain_id, network_name, apr, tvl)
VALUES 
('USDC_CRONOS', '0xD81FB2ea7fA64E3CC934eC7245566F4178A949E9', 338, 'Cronos', 13.5, 0),
('USDT_CRONOS', '0x97658341fc30EEBe61a62d65FA62743A5FE286fC', 338, 'Cronos', 13.0, 0),
('AVAX_CRONOS', '0xb0764B66447E3BFFB331660765Fe0101b2337963', 338, 'Cronos', 14.2, 0),
('WBTC_CRONOS', '0x466Bd36643148093e10e9615C36EeB97c5c99c3C', 338, 'Cronos', 5.5, 0),
('WETH_CRONOS', '0x2eaBA0B5582ca017EbF7Eb6305B7F72C807CFDa8', 338, 'Cronos', 6.8, 0),
('LINK_CRONOS', '0x78300a1F2EA8FA8E0Cb202610E639A54A829237b', 338, 'Cronos', 7.2, 0),
('BNB_CRONOS', '0x136a2956e38ae617F4be249b383191A55f274431', 338, 'Cronos', 11.0, 0)
ON CONFLICT (name, chain_id) DO UPDATE SET 
    token_address = EXCLUDED.token_address,
    network_name = EXCLUDED.network_name;

-- 9. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
