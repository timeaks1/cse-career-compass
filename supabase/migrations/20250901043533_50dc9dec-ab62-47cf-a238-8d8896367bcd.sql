-- Update RLS policies for experiences table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Users can update their own experiences" ON public.experiences;

-- Create new policies - only experience owners can edit/delete
CREATE POLICY "Users can delete their own experiences" 
ON public.experiences 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences" 
ON public.experiences 
FOR UPDATE 
USING (auth.uid() = user_id);