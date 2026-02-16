-- Add membership_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_status text DEFAULT 'none';

-- Add a check constraint to ensure valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT membership_status_check 
CHECK (membership_status IN ('none', 'pending', 'approved', 'rejected'));

-- Update existing profiles to have 'none' status (already handled by DEFAULT, but good for safety)
UPDATE public.profiles SET membership_status = 'none' WHERE membership_status IS NULL;

-- Allow users to update their own membership_status (for requesting access)
-- Note: You might need to adjust your existing RLS policies if they are too strict.
-- Alternatively, create a specific function to handle status updates if you want stricter control.
-- For now, we assume users can update their own profile.
