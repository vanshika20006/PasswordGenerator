-- Create vault_entries table for storing encrypted passwords
CREATE TABLE public.vault_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own vault entries
CREATE POLICY "Users can view own vault entries"
  ON public.vault_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vault entries
CREATE POLICY "Users can insert own vault entries"
  ON public.vault_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vault entries
CREATE POLICY "Users can update own vault entries"
  ON public.vault_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own vault entries
CREATE POLICY "Users can delete own vault entries"
  ON public.vault_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vault_entries_updated_at
  BEFORE UPDATE ON public.vault_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();