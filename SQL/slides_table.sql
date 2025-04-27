-- Create the slides table to store slide data for modules
CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slide_type TEXT NOT NULL,
  position INTEGER NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the slides table
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Modify modules table to replace content with description
ALTER TABLE modules 
  ADD COLUMN IF NOT EXISTS description TEXT,
  DROP COLUMN IF EXISTS content;

-- Policy for teachers to create slides
CREATE POLICY "Teachers can create slides" ON "slides"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON modules.course_id = courses.id
    WHERE modules.id = module_id
    AND courses.teacher_id = requesting_user_id()
  )
);

-- Policy for teachers to update their own slides
CREATE POLICY "Teachers can update their own slides" ON "slides"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON modules.course_id = courses.id
    WHERE modules.id = module_id
    AND courses.teacher_id = requesting_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON modules.course_id = courses.id
    WHERE modules.id = module_id
    AND courses.teacher_id = requesting_user_id()
  )
);

-- Policy for teachers to delete their own slides
CREATE POLICY "Teachers can delete their own slides" ON "slides"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON modules.course_id = courses.id
    WHERE modules.id = module_id
    AND courses.teacher_id = requesting_user_id()
  )
);

-- Policy for both teachers and students to read slides
CREATE POLICY "Users can read slides" ON "slides"
FOR SELECT TO authenticated
USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_slides_updated_at
BEFORE UPDATE ON slides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();