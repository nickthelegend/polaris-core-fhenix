
-- Create deposits table for tracking cross-chain proofs
CREATE TABLE public.deposits (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    tx_hash text NOT NULL,
    chain_key numeric NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ProofGenerated', 'Synced'
    proof jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT deposits_pkey PRIMARY KEY (id),
    CONSTRAINT deposits_tx_hash_key UNIQUE (tx_hash)
);

-- Add index for faster lookups by tx_hash
CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON public.deposits(tx_hash);

-- Enable Row Level Security (RLS) - Optional, allows public read/write for demo
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous/authenticated users to insert/update (since this is an API driven table)
-- Adjust 'anon' and 'authenticated' roles as per project security requirements
CREATE POLICY "Enable read access for all users" ON public.deposits
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.deposits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.deposits
    FOR UPDATE USING (true);
