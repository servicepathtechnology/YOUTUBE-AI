-- Supabase schema for VideoTutor AI

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail TEXT,
    transcript TEXT,
    summary TEXT,
    bullet_points TEXT[],
    key_concepts TEXT[],
    podcast_audio_url TEXT,
    podcast_script TEXT,
    language TEXT DEFAULT 'ENGLISH',
    source_coverage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Create policies for videos
CREATE POLICY "Users can insert their own videos" ON videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own videos" ON videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON videos
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chats
CREATE POLICY "Users can insert their own chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats" ON chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON chats
    FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for podcasts
-- You will need to create a bucket named 'podcasts' in the Supabase UI and set it to public or configure policies.

-- Migration: Add captions and language code support
ALTER TABLE videos ADD COLUMN IF NOT EXISTS captions JSONB;
-- Update language column to store ISO codes ('en', 'hi', 'te') going forward
-- Existing rows with 'ENGLISH'/'HINDI'/'TELUGU' remain valid; app normalises on read

-- Actify: Add new output columns for 5-tab structure
ALTER TABLE videos ADD COLUMN IF NOT EXISTS key_insights TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS action_plan TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS mistakes_to_avoid TEXT[];

-- Actify multilang: store all 3 language outputs as JSONB
ALTER TABLE videos ADD COLUMN IF NOT EXISTS multilang_content JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS podcast_urls JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS podcast_scripts JSONB;

-- Article support: track whether the source is a YouTube video or an article URL
ALTER TABLE videos ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'youtube';


-- Podcasts table: stores generated podcast metadata and Supabase Storage URLs
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ENGLISH', 'HINDI', 'TELUGU')),
    audio_url TEXT NOT NULL,
    script TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for podcasts
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own podcasts" ON podcasts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own podcasts" ON podcasts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcasts" ON podcasts
    FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket policy for podcasts (run after creating 'podcasts' bucket in Supabase UI)
-- INSERT policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload podcasts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'podcasts');

-- SELECT policy: authenticated users can read their own uploads
CREATE POLICY "Authenticated users can read podcasts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'podcasts');

-- DELETE policy: authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete podcasts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'podcasts');
