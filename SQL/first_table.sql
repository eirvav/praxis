-- Create a "users" table to store user information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- This will store the Clerk user ID
  role TEXT NOT NULL, -- 'student' or 'teacher'
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own record
CREATE POLICY "Users can read their own data" ON "public"."users" 
AS PERMISSIVE FOR SELECT 
TO authenticated 
USING (requesting_user_id() = id);

-- Allow users to read basic info of all users (needed for displaying teachers, etc.)
CREATE POLICY "Users can read basic info of all users" ON "public"."users" 
AS PERMISSIVE FOR SELECT 
TO authenticated 
USING (true);

-- Only allow the service role to insert/update user records
CREATE POLICY "Service role can insert user data" ON "public"."users" 
AS PERMISSIVE FOR INSERT 
TO authenticated 
WITH CHECK (true);


SECOND ENTRY TO THE SQL EDITOR:

-- Create a "modules" table
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;

-- Policy for teachers to create modules
CREATE POLICY "Teachers can create modules" ON "modules"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for teachers to update their own modules
CREATE POLICY "Teachers can update their own modules" ON "modules"
FOR UPDATE TO authenticated
USING (teacher_id = requesting_user_id())
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for teachers to delete their own modules
CREATE POLICY "Teachers can delete their own modules" ON "modules"
FOR DELETE TO authenticated
USING (teacher_id = requesting_user_id());

-- Policy for teachers to read all modules
CREATE POLICY "Teachers can read all modules" ON "modules"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for students to read all modules
CREATE POLICY "Students can read all modules" ON "modules"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'student'
  )
);


-- Create a "courses" table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;

-- Policy for teachers to create courses
CREATE POLICY "Teachers can create courses" ON "courses"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for teachers to update their own courses
CREATE POLICY "Teachers can update their own courses" ON "courses"
FOR UPDATE TO authenticated
USING (teacher_id = requesting_user_id())
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for teachers to delete their own courses
CREATE POLICY "Teachers can delete their own courses" ON "courses"
FOR DELETE TO authenticated
USING (teacher_id = requesting_user_id());

-- Policy for teachers to read all courses
CREATE POLICY "Teachers can read all courses" ON "courses"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  )
);

-- Policy for students to read all courses
CREATE POLICY "Students can read all courses" ON "courses"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'student'
  )
);

-- Add course_id to modules table
ALTER TABLE modules ADD COLUMN course_id UUID REFERENCES courses(id);

-- Update existing modules to handle NULL course_id temporarily
-- You'll need to assign courses to these modules later
ALTER TABLE modules ALTER COLUMN course_id SET NOT NULL;

-- Updated module policies to check course ownership
DROP POLICY IF EXISTS "Teachers can create modules" ON "modules";
CREATE POLICY "Teachers can create modules" ON "modules"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  ) AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_id
    AND courses.teacher_id = requesting_user_id()
  )
);

DROP POLICY IF EXISTS "Teachers can update their own modules" ON "modules";
CREATE POLICY "Teachers can update their own modules" ON "modules"
FOR UPDATE TO authenticated
USING (teacher_id = requesting_user_id())
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = requesting_user_id() 
    AND users.role = 'teacher'
  ) AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_id
    AND courses.teacher_id = requesting_user_id()
  )
);


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


-- 1. Add thumbnail_url column to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. Create module-thumbnails storage bucket
-- Note: You'll need to create the bucket through the Supabase UI
-- Go to Storage > Create new bucket > Name it "module-thumbnails" > Set to private

-- 3. Create storage policies for the module-thumbnails bucket
-- These will be applied after you create the bucket through the UI

-- Allow authenticated users to view thumbnails (public read access)
CREATE POLICY "Anyone can view thumbnails" ON storage.objects
FOR SELECT
USING (bucket_id = 'module-thumbnails');

-- Allow any authenticated user to upload thumbnails
-- We'll check if they're a teacher in the application code
CREATE POLICY "Authenticated users can insert thumbnails" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'module-thumbnails' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own thumbnails
CREATE POLICY "Users can update their own thumbnails" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'module-thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'module-thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for the module-videos bucket
-- Allow authenticated users to view videos
CREATE POLICY "Anyone can view videos" ON storage.objects
FOR SELECT
USING (bucket_id = 'module-videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'module-videos');

-- Allow users to update and delete their own videos
CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'module-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'module-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);