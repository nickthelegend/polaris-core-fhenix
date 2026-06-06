
-- Add missing columns to deposits for Bridge Monitor
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS user_address text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS amount text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS token_address text;

-- Optional: Update RLS policies if needed (already broad enough)
