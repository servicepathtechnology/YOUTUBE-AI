const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkVideos() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('videos')
    .select('id, video_id, title, transcript')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  if (data && data.length > 0) {
    const video = data[0];
    console.log('Latest Video:');
    console.log(`ID: ${video.id}`);
    console.log(`YouTube ID: ${video.video_id}`);
    console.log(`Title: ${video.title}`);
    console.log(`Transcript Length: ${video.transcript ? video.transcript.length : 'NULL/Undefined'}`);
    if (video.transcript && video.transcript.length === 0) {
        console.log('TRANSCRIPT IS AN EMPTY STRING');
    }
  } else {
    console.log('No videos found.');
  }
}

checkVideos();
