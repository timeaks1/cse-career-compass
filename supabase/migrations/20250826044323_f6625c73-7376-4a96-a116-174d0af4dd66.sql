-- Create experiences table
CREATE TABLE public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  experience_type TEXT NOT NULL CHECK (experience_type IN ('Intern', 'Placement')),
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('Online Assessment', 'Interview')),
  candidate_name TEXT NOT NULL,
  graduating_year INTEGER NOT NULL,
  branch TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('Selected', 'Waitlisted', 'Rejected')),
  experience_description TEXT NOT NULL,
  additional_tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create experience images table
CREATE TABLE public.experience_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can view and create)
CREATE POLICY "Anyone can view experiences" 
ON public.experiences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create experiences" 
ON public.experiences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view experience images" 
ON public.experience_images 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create experience images" 
ON public.experience_images 
FOR INSERT 
WITH CHECK (true);

-- Create storage bucket for experience images
INSERT INTO storage.buckets (id, name, public) VALUES ('experience-images', 'experience-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view experience images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'experience-images');

CREATE POLICY "Anyone can upload experience images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'experience-images');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();